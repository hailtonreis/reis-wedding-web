import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// =========================================================
// INTERFACE - RESPOSTA DO CONVITE
// =========================================================

export interface ConviteResponse {
  id: number;
  casamentoId: number;
  nomeConvidado: string;
  telefone: string;
  token: string;
  status: string;
  limiteAcompanhantes: number;
  dataConfirmacao: string | null;
  createdAt: string;
  updatedAt: string;

  // Acompanhantes cadastrados
  acompanhantes: string[];

  // Prazo para confirmação e alterações
  dataLimiteRsvp: string | null;
  prazoRsvpEncerrado: boolean;
}

// =========================================================
// INTERFACE - REQUISIÇÃO DE CONFIRMAÇÃO
// =========================================================

export interface ConfirmacaoPresencaRequest {
  acompanhantes: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ConviteService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/convites';

  // =========================================================
  // CONSULTAR CONVITE PELO TOKEN
  // =========================================================

  buscarPorToken(token: string): Observable<ConviteResponse> {
    return this.http.get<ConviteResponse>(
      `${this.apiUrl}/token/${encodeURIComponent(token)}`
    );
  }

  // =========================================================
  // CONFIRMAR PRESENÇA E SALVAR ACOMPANHANTES
  // =========================================================

  confirmarPresenca(
    token: string,
    acompanhantes: string[]
  ): Observable<ConviteResponse> {

    const request: ConfirmacaoPresencaRequest = {
      acompanhantes
    };

    return this.http.put<ConviteResponse>(
      `${this.apiUrl}/token/${encodeURIComponent(token)}/confirmar`,
      request
    );
  }

  // =========================================================
  // RECUSAR PRESENÇA
  // =========================================================

  recusarPresenca(token: string): Observable<ConviteResponse> {
    return this.http.put<ConviteResponse>(
      `${this.apiUrl}/token/${encodeURIComponent(token)}/recusar`,
      {}
    );
  }

  // FIM DO ARQUIVO
}