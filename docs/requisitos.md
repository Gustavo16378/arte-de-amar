# Requisitos · Arte de Amar

Site institucional e painel de conteúdo da OSC Arte de Amar (Palmas, TO),
levantados com a diretoria e o grupo do Projeto Integrador 1.

Cada requisito tem um identificador. Os testes citam esse identificador no
nome (`RF05 · …`), e a [matriz de rastreabilidade](testes.md#rastreabilidade)
liga um ao outro.

## Atores

| ator | quem é | o que faz |
|---|---|---|
| Visitante | qualquer pessoa na internet | lê o site, copia o PIX, se inscreve como voluntária |
| Diretoria | pessoas com login no painel | mantém o conteúdo, acompanha voluntários, gerencia acessos |
| Mantenedor | quem cuida do código (hoje, a equipe do PI, pelo GitHub) | publica, aplica migrations, recupera o acesso em último caso |

## Restrições

| id | restrição |
|---|---|
| RE01 | Custo zero de operação: só o domínio pode ser pago. |
| RE02 | Hospedagem no Cloudflare (Pages, Functions e D1 no plano gratuito). |
| RE03 | Design autoral aprovado, sem template; o painel não pode quebrar o design. |
| RE04 | A diretoria não é técnica: tudo pelo painel, em português, sem terminal. |
| RE05 | A conta da Cloudflare (hospedagem, banco e domínio) fica em nome da ONG; o código fica no GitHub, com a equipe. |

## Requisitos funcionais

### Site público

| id | requisito |
|---|---|
| RF01 | O site mostra projetos, linha do tempo, diretoria e números de impacto vindos do banco. |
| RF02 | Itens marcados como ocultos no painel não aparecem no site; seção sem nenhum item visível sai da página. |
| RF03 | Se a API falhar ou demorar mais de 2,5 s, o site abre com o conteúdo de reserva do código. |
| RF04 | O visitante se inscreve como voluntário (nome, WhatsApp, como quer ajudar); o contato fica guardado. |
| RF05 | Se a API estiver fora do ar, a inscrição abre o WhatsApp da ONG com a mensagem pronta. |
| RF06 | Textos e fotos fixos de cada seção (abertura, quem somos, história, atuação, como ajudar, rodapé) vêm do banco quando a diretoria os trocou. |
| RF07 | WhatsApp e chave PIX exibidos no site são os configurados no painel. |
| RF21 | O site mostra o QR Code do PIX e o "Pix copia e cola", gerados da chave configurada (BR Code estático, sem valor fixo). |

### Painel

| id | requisito |
|---|---|
| RF10 | Só entra no painel quem tem login; a sessão expira em 8 horas. |
| RF11 | A diretoria cria, edita, apaga, oculta e reordena projetos, marcos, pessoas da diretoria e números. |
| RF12 | A diretoria envia fotos, corrige a descrição, apaga as que não estão em uso e baixa uma ou todas (.zip). |
| RF13 | Fotos enviadas são reduzidas (até 1600px) e convertidas para WebP antes de subir. |
| RF14 | A diretoria edita os textos e fotos fixos de cada seção e pode voltar qualquer campo ao original. |
| RF15 | A diretoria vê os voluntários, marca como chamado, arquiva, apaga e chama no WhatsApp. |
| RF16 | A diretoria troca WhatsApp, chave PIX (com prévia do QR Code antes de salvar) e a própria senha. |
| RF17 | Qualquer pessoa da diretoria dá e tira acesso de outra e gera senha temporária para quem esqueceu. |
| RF18 | Quem entra com senha temporária é obrigado a criar uma senha própria antes de usar o painel. |
| RF19 | Toda alteração e todo login ficam registrados (quem, o quê, quando) e são consultáveis por dia e pessoa. |
| RF20 | O painel mostra o espaço usado do banco e avisa a partir de 70%. |

## Requisitos não funcionais

| id | categoria | requisito |
|---|---|---|
| RNF01 | Segurança | Senhas guardadas só como hash PBKDF2-SHA256 com salt por usuário. |
| RNF02 | Segurança | Sessão em cookie `HttpOnly`, `SameSite=Strict` (e `Secure` em HTTPS), assinada (JWT HS256). |
| RNF03 | Segurança | Pedido que altera dados vindo de outra origem é recusado (CSRF). |
| RNF04 | Segurança | Login trava 15 minutos depois de 5 senhas erradas; a mensagem não revela se o e-mail existe. |
| RNF05 | Segurança | Nenhum nome de tabela ou coluna vem do pedido; valores sempre por bind (sem SQL injection). |
| RNF06 | Segurança | Upload aceita só JPG, PNG e WebP conferidos pelos bytes, até 1,5 MB. |
| RNF07 | Segurança | Formulário público com campo-isca anti-robô e até 5 inscrições por hora por IP. |
| RNF08 | Integridade | Duas pessoas editando o mesmo item: quem salva por cima recebe aviso, nada é sobrescrito em silêncio. |
| RNF09 | Integridade | Mudanças de vários registros (reordenar, contatos) são gravadas juntas ou nenhuma. |
| RNF10 | Integridade | Foto em uso não pode ser apagada; dados inválidos são recusados com mensagem em português. |
| RNF11 | Contrato | As respostas da API seguem o formato que o site e o painel esperam (schemas em `tests/contratos.ts`). |
| RNF12 | Usabilidade | Painel em português, utilizável no celular (390px) e no computador. |
| RNF13 | Acessibilidade | Site e painel sem violações graves de acessibilidade (axe, WCAG 2 A/AA). |
| RNF14 | Capacidade | Cabe no plano gratuito do D1 (500 MB): fotos reduzidas, registros temporários limpos sozinhos, auditoria guardada por um ano. |
| RNF15 | Disponibilidade | O site público nunca fica em branco por causa do backend (ver RF03). |
| RNF16 | Manutenção | Esquema do banco versionado em migrations; cada parte testada automaticamente no CI. |
