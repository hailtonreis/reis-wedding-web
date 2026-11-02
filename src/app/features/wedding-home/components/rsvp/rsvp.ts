import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ConviteService } from './convite';

@Component({
  selector: 'app-rsvp',
  imports: [FormsModule],
  templateUrl: './rsvp.html',
  styleUrl: './rsvp.css',
})
export class RsvpComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private conviteService = inject(ConviteService);

  // Atualização visual no Angular zoneless
  private cdr = inject(ChangeDetectorRef);

  token: string | null = null;

  nomeConvidado = '';
  limiteAcompanhantes = 0;
  statusConvite = '';

  // =========================================================
  // CONTROLE DO PRAZO DE RSVP
  // =========================================================

  dataLimiteRsvp: string | null = null;
  prazoRsvpEncerrado = false;

  // =========================================================
  // ACOMPANHANTES
  // =========================================================

  acompanhantes: string[] = [];

  // =========================================================
  // CONTROLE DE SALVAMENTO E MENSAGENS
  // =========================================================

  salvando = false;

  mensagem = '';

  tipoMensagem: 'sucesso' | 'erro' | '' = '';

  // =========================================================
  // INICIALIZAÇÃO
  // =========================================================

  ngOnInit(): void {

    this.route.queryParamMap.subscribe(params => {

      this.token = params.get('token');

      this.limparMensagem();

      if (this.token) {

        this.buscarConvite(this.token);

      } else {

        this.exibirMensagem(
          'Nenhum convite foi informado. Verifique o link recebido.',
          'erro'
        );

      }

    });

  }

  // =========================================================
  // EXIBIR MENSAGEM
  // =========================================================

  private exibirMensagem(
    texto: string,
    tipo: 'sucesso' | 'erro'
  ): void {

    this.mensagem = texto;
    this.tipoMensagem = tipo;

    // Notifica o Angular sobre a alteração
    this.cdr.markForCheck();

  }

  // =========================================================
  // LIMPAR MENSAGEM
  // =========================================================

  limparMensagem(): void {

    this.mensagem = '';
    this.tipoMensagem = '';

    this.cdr.markForCheck();

  }

  // =========================================================
  // BUSCAR CONVITE PELO TOKEN
  // =========================================================

  private buscarConvite(token: string): void {

    this.conviteService.buscarPorToken(token).subscribe({

      next: (convite) => {

        console.log('Convite encontrado:', convite);

        this.nomeConvidado = convite.nomeConvidado;

        this.limiteAcompanhantes =
          convite.limiteAcompanhantes;

        this.statusConvite = convite.status;

        this.dataLimiteRsvp =
          convite.dataLimiteRsvp ?? null;

        this.prazoRsvpEncerrado =
          convite.prazoRsvpEncerrado ?? false;

        this.acompanhantes = [
          ...(convite.acompanhantes ?? [])
        ];

        this.limparMensagem();

        // Atualiza os dados do convite na tela
        this.cdr.markForCheck();

      },

      error: (erro) => {

        console.error('Erro ao buscar convite:', erro);

        this.exibirMensagem(
          'Não foi possível localizar seu convite. Verifique o link recebido.',
          'erro'
        );

      }

    });

  }

  // =========================================================
  // ADICIONAR ACOMPANHANTE
  // =========================================================

  adicionarAcompanhante(): void {

    if (this.prazoRsvpEncerrado || this.salvando) {
      return;
    }

    if (
      this.acompanhantes.length <
      this.limiteAcompanhantes
    ) {

      this.acompanhantes.push('');

      this.limparMensagem();

      this.cdr.markForCheck();

    } else {

      this.exibirMensagem(
        'Você atingiu o limite de acompanhantes permitido.',
        'erro'
      );

    }

  }

  // =========================================================
  // REMOVER ACOMPANHANTE
  // =========================================================

  removerAcompanhante(index: number): void {

    if (this.prazoRsvpEncerrado || this.salvando) {
      return;
    }

    if (
      index >= 0 &&
      index < this.acompanhantes.length
    ) {

      this.acompanhantes.splice(index, 1);

      this.limparMensagem();

      this.cdr.markForCheck();

    }

  }

  // =========================================================
  // CONFIRMAR PRESENÇA E SALVAR ACOMPANHANTES
  // =========================================================

  confirmarPresenca(): void {

    // Impede requisições simultâneas
    if (this.salvando) {
      return;
    }

    // =====================================================
    // VALIDAÇÃO DO TOKEN
    // =====================================================

    if (!this.token) {

      this.exibirMensagem(
        'Não foi possível identificar seu convite.',
        'erro'
      );

      return;

    }

    // =====================================================
    // VALIDAÇÃO DO PRAZO
    // =====================================================

    if (this.prazoRsvpEncerrado) {

      this.exibirMensagem(
        'O prazo para confirmação e alterações foi encerrado.',
        'erro'
      );

      return;

    }

    this.limparMensagem();

    // Remove espaços desnecessários dos nomes
    const nomes = this.acompanhantes.map(
      nome => nome.trim()
    );

    // =====================================================
    // VALIDAÇÃO DE CAMPOS VAZIOS
    // =====================================================

    if (nomes.some(nome => nome.length === 0)) {

      this.exibirMensagem(
        'Informe o nome de todos os acompanhantes.',
        'erro'
      );

      return;

    }

    // =====================================================
    // VALIDAÇÃO DO LIMITE
    // =====================================================

    if (nomes.length > this.limiteAcompanhantes) {

      this.exibirMensagem(
        'Quantidade de acompanhantes acima do limite permitido.',
        'erro'
      );

      return;

    }

    // =====================================================
    // VALIDAÇÃO DE NOMES DUPLICADOS
    // =====================================================

    const nomesNormalizados = nomes.map(
      nome => nome
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('pt-BR')
    );

    const nomesUnicos = new Set(nomesNormalizados);

    if (nomesUnicos.size !== nomesNormalizados.length) {

      this.exibirMensagem(
        'Existem acompanhantes com nomes repetidos. Verifique os dados informados.',
        'erro'
      );

      return;

    }

    // =====================================================
    // INICIAR SALVAMENTO
    // =====================================================

    this.salvando = true;

    // Atualiza o botão para "Salvando..."
    this.cdr.markForCheck();

    this.conviteService.confirmarPresenca(
      this.token,
      nomes
    )
    .pipe(

      // ===================================================
      // FINALIZAÇÃO DO SALVAMENTO
      // ===================================================

      finalize(() => {

        // Executado no sucesso e no erro
        this.salvando = false;

        // Garante a atualização visual do botão
        this.cdr.markForCheck();

      })

    )
    .subscribe({

      // ===================================================
      // SUCESSO
      // ===================================================

      next: (convite) => {

        this.statusConvite = convite.status;

        this.acompanhantes = [
          ...(convite.acompanhantes ?? [])
        ];

        this.dataLimiteRsvp =
          convite.dataLimiteRsvp ??
          this.dataLimiteRsvp;

        this.prazoRsvpEncerrado =
          convite.prazoRsvpEncerrado ??
          this.prazoRsvpEncerrado;

        this.exibirMensagem(
          'Presença e acompanhantes salvos com sucesso!',
          'sucesso'
        );

        // Atualiza a tela com os dados retornados
        this.cdr.markForCheck();

      },

      // ===================================================
      // ERRO
      // ===================================================

      error: (erro) => {

        console.error(
          'Erro ao confirmar presença:',
          erro
        );

        const mensagem =
          erro.error?.mensagem ??
          'Não foi possível salvar sua confirmação. Tente novamente.';

        this.exibirMensagem(
          mensagem,
          'erro'
        );

        this.cdr.markForCheck();

      }

    });

  }

  // =========================================================
  // FIM DO ARQUIVO RSVP.TS
  // =========================================================

}