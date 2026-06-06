# Instalação na VPS Hostinger (WhatsApp API)

Este guia acompanha o arquivo `docker-compose.evolution.yml` para você subir a infraestrutura da Evolution API (motor do WhatsApp) na sua Hostinger VPS (Ubuntu 22.04+).

## Pré-requisitos
1. Uma VPS na Hostinger (plano recomendado: mínimo 2GB RAM).
2. Acesso SSH Root.
3. Um subdomínio criado na Cloudflare apontando para o IP da sua VPS (Ex: `api.seudominio.com.br`) - Certifique-se de deixar a nuvem **CINZA** (DNS Only) na Cloudflare.

## Passo a Passo

### 1. Instale o Docker e Docker Compose
Acesse via SSH e rode:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker
sudo systemctl start docker
```

### 2. Configure os Arquivos
Crie uma pasta no servidor e transfira o arquivo `docker-compose.evolution.yml` para lá, renomeando-o apenas para `docker-compose.yml`.

```bash
mkdir -p ~/evolution-api
cd ~/evolution-api
nano docker-compose.yml
# Cole o conteúdo do arquivo e edite as variáveis SERVER_URL e AUTHENTICATION_API_KEY
```

### 3. Suba os Containers
```bash
docker-compose up -d
```
Verifique os logs para garantir que subiu:
```bash
docker-compose logs -f evolution-api
```

### 4. Configuração de Domínio e SSL (Nginx Recomentado)
Como a Evolution expõe a porta 8080, você deve instalar o Nginx e o Certbot para prover conexão segura (`https://`) e proxy reverso.

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Crie o arquivo de configuração do Nginx:
```bash
sudo nano /etc/nginx/sites-available/evolution
```

Cole a configuração abaixo (substituindo pelo seu domínio):
```nginx
server {
    server_name api.seudominio.com.br;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative e gere o SSL:
```bash
sudo ln -s /etc/nginx/sites-available/evolution /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d api.seudominio.com.br
```

Pronto! Sua API do WhatsApp está rodando de forma segura e pronta para ser consumida pelo SaaS.
