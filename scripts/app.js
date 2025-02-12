// Configurações da Planilha
const SPREADSHEET_ID = '103-Ljds6f9pvdGm-8kXG1XuMeaKj4RPmzEObo2EyDFs'; // ID da sua planilha
const TURMAS_RANGE = 'Turmas!A2:B'; // Intervalo de dados da aba "Turmas"
const ALUNOS_RANGE = 'Alunos!A2:C'; // Intervalo de dados da aba "Alunos"
const FREQUENCIA_RANGE = 'Frequencia!A2:C'; // Intervalo de dados da aba "Frequencia"

// Defina o token de acesso manualmente aqui
let ACCESS_TOKEN = ''; // Substitua pelo token que você gerou manualmente

// Defina a função appendSheetData antes de usá-la
async function appendSheetData(range, valores) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`;
    try {
        const token = await getValidAccessToken(); // Obtém o token válido
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                values: valores,
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao enviar dados para a planilha: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Dados enviados com sucesso:', data);
        return data;
    } catch (erro) {
        console.error('Erro ao enviar dados:', erro);
        throw erro;
    }
}

async function getAccessToken() {
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbxWsKTzrIzQslkZwRZHvByErXEoB0FfQqJ7Z7A1k7WeVMriOkmSZ9uHqlciTVX9kFio/exec');
        if (!response.ok) {
            throw new Error(`Erro ao obter token: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const token = data.token;

        // Armazena o token e o horário atual no localStorage
        localStorage.setItem('accessToken', token);
        localStorage.setItem('tokenTimestamp', Date.now());

        console.log('Token obtido com sucesso:', token);
        return token;
    } catch (erro) {
        console.error('Erro ao obter token:', erro);
        throw erro;
    }
}
async function getValidAccessToken() {
    const token = localStorage.getItem('accessToken');
    const tokenTimestamp = localStorage.getItem('tokenTimestamp');

    // Verifica se o token existe e se ainda está válido (1 hora de validade)
    if (token && tokenTimestamp && (Date.now() - tokenTimestamp < 3600000)) {
        console.log('Token ainda válido. Reutilizando:', token);
        return token;
    } else {
        console.log('Token expirado ou não encontrado. Gerando novo token...');
        return await getAccessToken(); // Gera um novo token
    }
}



// Função para buscar dados da planilha
async function fetchSheetData(range) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
    try {
        // Obtém o token válido
        const token = await getValidAccessToken();

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const errorDetails = await response.json();
            throw new Error(`Erro ao carregar dados da planilha: ${response.status} ${response.statusText}. Detalhes: ${JSON.stringify(errorDetails)}`);
        }
        const data = await response.json();
        console.log('Dados carregados:', data);
        return data;
    } catch (erro) {
        console.error('Erro na requisição:', erro);
        throw erro;
    }
}

// Função para carregar as turmas
async function loadTurmas(containerId) {
    const listaTurmas = document.getElementById(containerId);
    if (!listaTurmas) {
        console.error(`Elemento com ID "${containerId}" não encontrado.`);
        return;
    }

    console.log('Elemento lista-turmas encontrado:', listaTurmas);
    listaTurmas.innerHTML = '<p>Carregando turmas...</p>';

    try {
        const data = await fetchSheetData(TURMAS_RANGE);
        console.log('Dados das turmas:', data);
        const turmas = data.values;

        if (turmas && turmas.length > 0) {
            listaTurmas.innerHTML = ''; // Limpa o conteúdo anterior
            turmas.forEach(turma => {
                const turmaDiv = document.createElement('div');
                turmaDiv.className = 'turma-item';
                turmaDiv.innerHTML = `
                    <span>${turma[1]}</span>
                `;
                turmaDiv.onclick = () => {
                    window.location.href = `frequencia.html?turmaId=${turma[0]}`;
                };
                listaTurmas.appendChild(turmaDiv);
            });
        } else {
            listaTurmas.innerHTML = '<p>Nenhuma turma cadastrada.</p>';
        }
    } catch (erro) {
        listaTurmas.innerHTML = '<p>Erro ao carregar turmas. Verifique o console.</p>';
        console.error(erro);
    }
}

// Função para carregar os alunos da turma selecionada
async function loadAlunos() {
    const listaAlunos = document.getElementById('lista-alunos');
    const tituloTurma = document.getElementById('titulo-turma');

    if (!listaAlunos || !tituloTurma) {
        console.error('Elementos não encontrados.');
        return;
    }

    listaAlunos.innerHTML = '<p>Carregando alunos...</p>';

    // Obtém o ID da turma da URL
    const urlParams = new URLSearchParams(window.location.search);
    const turmaId = urlParams.get('turmaId');

    if (!turmaId) {
        listaAlunos.innerHTML = '<p>Turma não selecionada.</p>';
        return;
    }

    try {
        // Carrega as turmas para obter o nome da turma selecionada
        const dataTurmas = await fetchSheetData(TURMAS_RANGE);
        const turmaSelecionada = dataTurmas.values.find(turma => turma[0] === turmaId);

        if (turmaSelecionada) {
            tituloTurma.textContent = `Registrar Frequência - ${turmaSelecionada[1]}`;
        }

        // Carrega os alunos da turma e ordena por nome (coluna 1)
        const dataAlunos = await fetchSheetData(ALUNOS_RANGE);
        const alunos = dataAlunos.values
            .filter(row => row[2] === turmaId) // Filtra alunos pela turma
            .sort((a, b) => a[1].localeCompare(b[1])); // Ordena por nome (coluna 1)

        if (alunos.length > 0) {
            listaAlunos.innerHTML = ''; // Limpa o conteúdo anterior
            alunos.forEach((aluno) => {
                const alunoDiv = document.createElement('div');
                alunoDiv.className = 'aluno-item';
                alunoDiv.setAttribute('data-id', aluno[0]); // Usa o ID da coluna A da planilha
                alunoDiv.innerHTML = `
                    <span>${aluno[1]}</span>
                    <button class="btn-presenca" data-status="P">P</button>
                `;
                listaAlunos.appendChild(alunoDiv);
            });

            // Adiciona o evento de clique aos botões de presença
            document.querySelectorAll('.btn-presenca').forEach(botao => {
                botao.addEventListener('click', alternarPresenca);
            });
        } else {
            listaAlunos.innerHTML = '<p>Nenhum aluno cadastrado nesta turma.</p>';
        }
    } catch (erro) {
        listaAlunos.innerHTML = '<p>Erro ao carregar alunos. Verifique o console.</p>';
        console.error(erro);
    }
}

// Função para alternar o estado da presença
function alternarPresenca(event) {
    const botao = event.target;
    const statusAtual = botao.getAttribute('data-status');

    // Define o próximo estado
    let proximoStatus, cor;
    if (statusAtual === 'P') {
        proximoStatus = 'F';
        cor = 'vermelho';
    } else if (statusAtual === 'F') {
        proximoStatus = 'FJ';
        cor = 'azul';
    } else {
        proximoStatus = 'P';
        cor = 'verde';
    }

    // Atualiza o botão
    botao.setAttribute('data-status', proximoStatus);
    botao.textContent = proximoStatus.charAt(0).toUpperCase() + proximoStatus.slice(1);
    botao.style.backgroundColor = cor;
}

// Função para salvar a frequência
async function salvarFrequencia() {
    const listaAlunos = document.getElementById('lista-alunos');
    const botoesPresenca = listaAlunos.querySelectorAll('.btn-presenca');
    const dataFrequencia = document.getElementById('data-frequencia').value;

    if (!dataFrequencia) {
        alert('Selecione uma data antes de salvar a frequência.');
        return;
    }

    // Obtém o ID da turma da URL
    const urlParams = new URLSearchParams(window.location.search);
    const turmaId = urlParams.get('turmaId');

    if (!turmaId) {
        alert('Turma não selecionada.');
        return;
    }

    // Verifica se já existe frequência para a turma e data selecionadas
    try {
        const frequenciaExistente = await verificarFrequenciaExistente(turmaId, dataFrequencia);
        if (frequenciaExistente) {
            alert('Uma frequência para esta turma e data já foi registrada nessa data.');
            return;
        }
    } catch (erro) {
        console.error('Erro ao verificar frequência existente:', erro);
        alert('Erro ao verificar frequência existente. Verifique o console.');
        return;
    }

    const registros = [];

    botoesPresenca.forEach((botao) => {
        const status = botao.getAttribute('data-status');
        const alunoDiv = botao.parentElement;
        const alunoId = alunoDiv.getAttribute('data-id'); // Obtém o ID do aluno
        registros.push([turmaId, alunoId, dataFrequencia, status]); // Formato: ID_TURMA, ID_Aluno, Data, Presente
    });

    try {
        // Enviar os dados para a planilha no formato correto
        await appendSheetData(FREQUENCIA_RANGE, registros);
        alert('Frequência salva com sucesso!');
    } catch (erro) {
        console.error('Erro ao salvar frequência:', erro);
        alert('Erro ao salvar frequência. Verifique o console.');
    }
}

// Função para verificar se já existe frequência para a turma e data
async function verificarFrequenciaExistente(turmaId, data) {
    try {
        const dataFrequencia = await fetchSheetData(FREQUENCIA_RANGE);
        const frequencias = dataFrequencia.values;

        if (frequencias && frequencias.length > 0) {
            // Verifica se há algum registro com a mesma turma e data
            const frequenciaExistente = frequencias.some(registro => registro[0] === turmaId && registro[2] === data);
            return frequenciaExistente;
        }

        return false; // Não há registros de frequência
    } catch (erro) {
        console.error('Erro ao verificar frequência existente:', erro);
        throw erro;
    }
}

// Carrega os alunos ao abrir a página
if (window.location.pathname.endsWith('frequencia.html')) {
    loadAlunos();
}

// Carrega as turmas ao abrir a página
if (window.location.pathname.endsWith('turmas.html') || window.location.pathname.endsWith('cadastro.html')) {
    console.log('Carregando turmas...'); // Log para depuração
    loadTurmas('lista-turmas');
}

// Adiciona o evento de submit ao formulário
document.getElementById('form-cadastro')?.addEventListener('submit', async function(event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value.toUpperCase();
    const turmaId = document.getElementById('turma').value;

    if (!nome || !turmaId) {
        alert('Preencha todos os campos!');
        return;
    }

    try {
        // Carrega os alunos existentes para gerar o próximo ID
        const dataAlunos = await fetchSheetData(ALUNOS_RANGE);
        const proximoId = dataAlunos.values.length + 1; // Gera o próximo ID

        // Adiciona o aluno à planilha na ordem correta: ID, Nome, Turma
        await appendSheetData('Alunos!A2:C', [[proximoId, nome, turmaId]]);
        alert('Aluno cadastrado com sucesso!');
        document.getElementById('form-cadastro').reset(); // Limpa o formulário
    } catch (erro) {
        console.error('Erro ao cadastrar aluno:', erro);
        alert('Erro ao cadastrar aluno. Verifique o console.');
    }
});
// Inicializa o token quando o app é carregado
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const token = await getValidAccessToken();
        console.log('Token inicializado:', token);
    } catch (erro) {
        console.error('Erro ao inicializar o token:', erro);
    }
});
document.addEventListener('DOMContentLoaded', function () {
    const mensagem = localStorage.getItem('mensagemBoasVindas') || '';
    if (mensagem) {
        document.querySelector('spam').innerText = mensagem;
    }
});

// Função de logout
function logout() {
    localStorage.removeItem('logado');
    localStorage.removeItem('mensagemBoasVindas');
    window.location.href = 'login.html';
}

function limparCookies() {
    localStorage.clear();
    var cookies = document.cookie.split(";");

    // Limpa todos os cookies
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var equalsPos = cookie.indexOf("=");
        var name = equalsPos > -1 ? cookie.substr(0, equalsPos) : cookie;
        document.cookie = name + "=;expires=" + new Date(0).toUTCString() + ";path=/";
    }
}
setInterval(limparCookies, 1800000);
