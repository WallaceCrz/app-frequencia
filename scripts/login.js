// Configurações da Planilha
const SPREADSHEET_ID = '1l3tH-7ImeN5U-Refd_kBVCqmJRZ2mYR7QUhuMmt5otw'; // ID da sua planilha
const LOGIN_RANGE = 'Login!A2:C'; // Intervalo da aba "Login"
const API_KEY = 'AIzaSyDuYHkaWg9HOV2zUbPKESyr3MyKtDJEwkY'; // Sua API Key

// Função para buscar dados da planilha
async function fetchSheetData(range) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao carregar dados da planilha: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.values || [];
    } catch (erro) {
        console.error('Erro na requisição:', erro);
        throw erro;
    }
}

// Função para verificar as credenciais do usuário
async function verificarCredenciais(usuario, senha) {
    try {
        const dadosLogin = await fetchSheetData(LOGIN_RANGE);

        if (!dadosLogin.length) {
            console.error('Nenhum dado de login encontrado.');
            return false;
        }

        // Verifica se o usuário e a senha correspondem
        for (const credencial of dadosLogin) {
            if (credencial[0] === usuario && credencial[1] === senha) {
                const mensagem = credencial[2] || ''; // Se houver mensagem na coluna C, salva
                localStorage.setItem('mensagemBoasVindas', mensagem);
                return true;
            }
        }
        return false;
    } catch (erro) {
        console.error('Erro ao verificar credenciais:', erro);
        return false;
    }
}

// Adiciona o evento de submit ao formulário de login
document.getElementById('form-login').addEventListener('submit', async function(event) {
    event.preventDefault();

    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;

    const credenciaisValidas = await verificarCredenciais(usuario, senha);

    if (credenciaisValidas) {
        localStorage.setItem('logado', 'true'); // Marca o usuário como logado
        window.location.href = 'index.html'; // Redireciona para a página principal
    } else {
        document.getElementById('mensagem-erro').style.display = 'block'; // Exibe mensagem de erro
    }
});
