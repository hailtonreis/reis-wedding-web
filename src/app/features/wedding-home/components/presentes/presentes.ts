import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';

// =========================================================
// INTERFACE - PRESENTE
// =========================================================

interface Presente {
  titulo: string;
  valor: number;
}

// =========================================================
// COMPONENTE - PRESENTES
// =========================================================

@Component({
  selector: 'app-presentes',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './presentes.html',
  styleUrl: './presentes.css',
})
export class PresentesComponent {

  // =========================================================
  // CONFIGURAÇÃO PIX REAL
  // =========================================================

  // ATENÇÃO:
  // Informe uma chave Pix cadastrada (CPF, e-mail, telefone ou aleatória).
  // Esta chave ficará visível no frontend publicado.

  private readonly chavePix = '61020508191';

  // Nome: máximo de 25 caracteres no BR Code.
  // Cidade: máximo de 15 caracteres.

  nomeRecebedorPix = 'HAILTON GLORIA REIS';

  cidadeRecebedorPix = 'BRASILIA';

  // =========================================================
  // CONTROLE DO MODAL
  // =========================================================

  modalPixAberto = false;

  presenteSelecionado: Presente | null = null;

  valorLivre: number | null = null;

  codigoPix = '';

  qrCodePix = '';

  mensagemPix = '';

  pixCopiado = false;

  gerandoQrCode = false;

  private geracaoAtual = 0;

  // =========================================================
  // ABRIR MODAL PIX
  // =========================================================

  async abrirPix(
    titulo: string,
    valor: number
  ): Promise<void> {

    const valorNumerico = Number(valor);

    if (
      !Number.isFinite(valorNumerico) ||
      valorNumerico < 0.01
    ) {
      this.mensagemPix =
        'Informe um valor válido para presentear.';
      return;
    }

    this.presenteSelecionado = {
      titulo,
      valor: valorNumerico
    };

    this.modalPixAberto = true;

    this.codigoPix = '';
    this.qrCodePix = '';
    this.mensagemPix = '';
    this.pixCopiado = false;
    this.gerandoQrCode = true;

    const identificadorGeracao = ++this.geracaoAtual;

    try {

      // =========================================================
      // VALIDAR CONFIGURAÇÃO DA CHAVE PIX
      // =========================================================

      if (
        !this.chavePix.trim() ||
        this.chavePix.trim() === 'SUA_CHAVE_PIX_AQUI'
      ) {
        throw new Error(
          'Configure uma chave Pix válida no presentes.ts.'
        );
      }

      // Gera o código Pix no padrão BR Code.
      const codigo = this.gerarCodigoPix(valorNumerico);

      // Transforma o código Pix em QR Code.
      const imagem = await QRCode.toDataURL(
        codigo,
        {
          width: 260,
          margin: 2,
          errorCorrectionLevel: 'M',
          type: 'image/png'
        }
      );

      if (
        !this.modalPixAberto ||
        identificadorGeracao !== this.geracaoAtual
      ) {
        return;
      }

      this.codigoPix = codigo;
      this.qrCodePix = imagem;

    } catch (error) {

      console.error(
        '[Reis Wedding] Erro ao gerar Pix:',
        error
      );

      if (identificadorGeracao === this.geracaoAtual) {
        this.codigoPix = '';
        this.qrCodePix = '';

        this.mensagemPix =
          error instanceof Error
            ? error.message
            : 'Não foi possível gerar o Pix.';
      }

    } finally {

      if (identificadorGeracao === this.geracaoAtual) {
        this.gerandoQrCode = false;
      }

    }

  }

  // =========================================================
  // GERAR CÓDIGO PIX ESTÁTICO - BR CODE
  // =========================================================

  private gerarCodigoPix(valor: number): string {

    // -----------------------------------------------------
    // IDENTIFICAÇÃO DO PIX
    // -----------------------------------------------------

    const payloadFormatIndicator =
      this.campoEmv('00', '01');

    // -----------------------------------------------------
    // DADOS DA CHAVE PIX
    // -----------------------------------------------------

    const gui = this.campoEmv(
      '00',
      'br.gov.bcb.pix'
    );

    const chave = this.campoEmv(
      '01',
      this.chavePix.trim()
    );

    const merchantAccountInformation =
      this.campoEmv(
        '26',
        gui + chave
      );

    // -----------------------------------------------------
    // CATEGORIA E MOEDA
    // -----------------------------------------------------

    const merchantCategoryCode =
      this.campoEmv('52', '0000');

    const transactionCurrency =
      this.campoEmv('53', '986');

    // -----------------------------------------------------
    // VALOR DO PRESENTE
    // -----------------------------------------------------

    const transactionAmount =
      this.campoEmv(
        '54',
        valor.toFixed(2)
      );

    // -----------------------------------------------------
    // PAÍS
    // -----------------------------------------------------

    const countryCode =
      this.campoEmv('58', 'BR');

    // -----------------------------------------------------
    // NOME DO RECEBEDOR
    // -----------------------------------------------------

    const merchantName =
      this.campoEmv(
        '59',
        this.normalizarTexto(
          this.nomeRecebedorPix,
          25
        )
      );

    // -----------------------------------------------------
    // CIDADE DO RECEBEDOR
    // -----------------------------------------------------

    const merchantCity =
      this.campoEmv(
        '60',
        this.normalizarTexto(
          this.cidadeRecebedorPix,
          15
        )
      );

    // -----------------------------------------------------
    // IDENTIFICADOR DA TRANSAÇÃO
    // -----------------------------------------------------

    // "***" é utilizado em Pix estático sem
    // identificador próprio de transação.

    const txid = this.campoEmv('05', '***');

    const additionalDataField =
      this.campoEmv('62', txid);

    // -----------------------------------------------------
    // MONTAR PAYLOAD SEM CRC
    // -----------------------------------------------------

    const payloadSemCrc = [
      payloadFormatIndicator,
      merchantAccountInformation,
      merchantCategoryCode,
      transactionCurrency,
      transactionAmount,
      countryCode,
      merchantName,
      merchantCity,
      additionalDataField,
      '6304'
    ].join('');

    // -----------------------------------------------------
    // CALCULAR CRC16
    // -----------------------------------------------------

    const crc = this.calcularCrc16(payloadSemCrc);

    return payloadSemCrc + crc;

  }

  // =========================================================
  // CONSTRUIR CAMPO EMV
  // =========================================================

  private campoEmv(
    id: string,
    valor: string
  ): string {

    const tamanho = new TextEncoder()
      .encode(valor)
      .length;

    if (tamanho > 99) {
      throw new Error(
        `Campo Pix ${id} excede o tamanho permitido.`
      );
    }

    return (
      id +
      tamanho.toString().padStart(2, '0') +
      valor
    );

  }

  // =========================================================
  // NORMALIZAR NOME E CIDADE
  // =========================================================

  private normalizarTexto(
    texto: string,
    tamanhoMaximo: number
  ): string {

    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9 .-]/g, '')
      .trim()
      .substring(0, tamanhoMaximo);

  }

  // =========================================================
  // CALCULAR CRC16/CCITT-FALSE
  // =========================================================

  private calcularCrc16(
    texto: string
  ): string {

    let crc = 0xffff;

    const bytes = new TextEncoder().encode(texto);

    for (const byte of bytes) {

      crc ^= byte << 8;

      for (let i = 0; i < 8; i++) {

        if ((crc & 0x8000) !== 0) {

          crc = ((crc << 1) ^ 0x1021) & 0xffff;

        } else {

          crc = (crc << 1) & 0xffff;

        }

      }

    }

    return crc
      .toString(16)
      .toUpperCase()
      .padStart(4, '0');

  }

  // =========================================================
  // PRESENTE COM VALOR LIVRE
  // =========================================================

  abrirPixValorLivre(): void {

    const valor = Number(this.valorLivre);

    if (
      !Number.isFinite(valor) ||
      valor < 0.01
    ) {

      this.mensagemPix =
        'Informe um valor válido para presentear.';

      return;

    }

    void this.abrirPix(
      'Presenteie com carinho',
      valor
    );

  }

  // =========================================================
  // FECHAR MODAL
  // =========================================================

  fecharPix(): void {

    this.geracaoAtual++;

    this.modalPixAberto = false;

    this.presenteSelecionado = null;

    this.codigoPix = '';

    this.qrCodePix = '';

    this.mensagemPix = '';

    this.pixCopiado = false;

    this.gerandoQrCode = false;

  }

  // =========================================================
  // COPIAR CÓDIGO PIX
  // =========================================================

  async copiarCodigoPix(): Promise<void> {

    if (!this.codigoPix) {

      this.mensagemPix =
        'O código Pix ainda não está disponível.';

      return;

    }

    try {

      await navigator.clipboard.writeText(
        this.codigoPix
      );

      this.pixCopiado = true;

      this.mensagemPix =
        'Código Pix copiado com sucesso!';

    } catch (error) {

      console.error(
        '[Reis Wedding] Erro ao copiar Pix:',
        error
      );

      this.pixCopiado = false;

      this.mensagemPix =
        'Não foi possível copiar automaticamente.';

    }

  }

  // =========================================================
  // VALOR SELECIONADO
  // =========================================================

  get valorSelecionado(): number {

    return this.presenteSelecionado?.valor ?? 0;

  }

  // =========================================================
  // FIM DO ARQUIVO PRESENTES.TS
  // REIS WEDDING
  // =========================================================

}