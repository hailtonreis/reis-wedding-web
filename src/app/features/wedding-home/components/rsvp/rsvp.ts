import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConviteService } from './convite';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rsvp',
  imports: [FormsModule],
  templateUrl: './rsvp.html',
  styleUrl: './rsvp.css',
})
export class RsvpComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private conviteService = inject(ConviteService);

  token: string | null = null;

  nomeConvidado = '';
  limiteAcompanhantes = 0;
  statusConvite = '';

  // Data-limite para confirmação de presença
  dataLimiteRsvp: string | null = null;

  // Indica se o prazo para alterações foi encerrado
  prazoRsvpEncerrado = false;

  // Lista de acompanhantes
  acompanhantes: string[] = [];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');

      if (this.token) {
        this.buscarConvite(this.token);
      } else {
        console.log('Nenhum token informado na URL.');
      }
    });
  }

  // =========================================================
  // BUSCAR CONVITE PELO TOKEN
  // =========================================================

  private buscarConvite(token: string): void {
    this.conviteService.buscarPorToken(token).subscribe({
      next: (convite) => {
        console.log('Convite encontrado:', convite);

        // Dados principais do convite
        this.nomeConvidado = convite.nomeConvidado;
        this.limiteAcompanhantes = convite.limiteAcompanhantes;
        this.statusConvite = convite.status;

        // Dados do prazo de RSVP
        this.dataLimiteRsvp = convite.dataLimiteRsvp ?? null;
        this.prazoRsvpEncerrado = convite.prazoRsvpEncerrado ?? false;

        // Carrega os acompanhantes cadastrados no banco
        this.acompanhantes = [...(convite.acompanhantes ?? [])];
      },
      error: (erro) => {
        console.error('Erro ao buscar convite:', erro);
      }
    });
  }

  // =========================================================
  // ADICIONAR ACOMPANHANTE
  // =========================================================

  adicionarAcompanhante(): void {

    // Não permite alterações após o prazo
    if (this.prazoRsvpEncerrado) {
      return;
    }

    // Respeita o limite definido no convite
    if (this.acompanhantes.length < this.limiteAcompanhantes) {
      this.acompanhantes.push('');
    }
  }

  // =========================================================
  // REMOVER ACOMPANHANTE
  // =========================================================

  removerAcompanhante(index: number): void {

    // Não permite alterações após o prazo
    if (this.prazoRsvpEncerrado) {
      return;
    }

    // Remove o acompanhante da lista local
    if (index >= 0 && index < this.acompanhantes.length) {
      this.acompanhantes.splice(index, 1);
    }
  }

// =========================================================
// CONFIRMAR PRESENÇA E SALVAR ACOMPANHANTES
// =========================================================

confirmarPresenca(): void {

  if (!this.token || this.prazoRsvpEncerrado) {
    return;
  }

  // Remove espaços desnecessários dos nomes
  const nomes = this.acompanhantes.map(nome => nome.trim());

  // Verifica se existem campos vazios
  if (nomes.some(nome => nome.length === 0)) {
    alert('Informe o nome de todos os acompanhantes.');
    return;
  }

  // Evita enviar uma quantidade acima do limite
  if (nomes.length > this.limiteAcompanhantes) {
    alert('Quantidade de acompanhantes acima do limite permitido.');
    return;
  }

  this.conviteService.confirmarPresenca(this.token, nomes).subscribe({

    next: (convite) => {

      this.statusConvite = convite.status;
      this.acompanhantes = [...(convite.acompanhantes ?? [])];

      alert('Presença e acompanhantes salvos com sucesso!');

    },

    error: (erro) => {

      console.error('Erro ao confirmar presença:', erro);

      const mensagem =
        erro.error?.mensagem ??
        'Não foi possível salvar sua confirmação.';

      alert(mensagem);

    }

  });

}

  // FIM DO ARQUIVO
}