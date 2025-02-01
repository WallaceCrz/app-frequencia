// Configurações da Planilha
const SPREADSHEET_ID = '103-Ljds6f9pvdGm-8kXG1XuMeaKj4RPmzEObo2EyDFs'; // ID da sua planilha
const API_KEY = 'af90990c9b6e78592f38e3114e368cfcec397490'; // Sua chave da API
const TURMAS_RANGE = 'Turmas!A2:B'; // Intervalo de dados da aba "Turmas"
const ALUNOS_RANGE = 'Alunos!A2:C'; // Intervalo de dados da aba "Alunos"
const FREQUENCIA_RANGE = 'Frequencia!A2:C'; // Intervalo de dados da aba "Frequencia"
let ACCESS_TOKEN = '';
// Função para obter o token de acesso do backend
async function getAccessToken() {
    try {
        const response = await fetch('https://script.googleusercontent.com/macros/echo?user_content_key=Fsnpm4rxFclXlgwhIOmaaPAbuU-5D3XXsGC2TbQsRCQJJ5o3usWrY5Ulw7T9A0Hnd2a55mcQKkVc9QlYADdH2T6MV2qxPVHkm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnLY2akZkiofaDCJp5m2Jv6HAOF8pigkgyLO4qduNzmsIk-wVmANTm_dc6B9IaA3GBwU1ilyFiMBu2MVyXXBGjzY1FG-7dlb48A&lib=MK03d-YApCvcHCyBc5rILbO9D7zY1TYX_');
        const data = await response.json();
        ACCESS_TOKEN = data.token;
        console.log('Token obtido com sucesso:', ACCESS_TOKEN);
    } catch (erro) {
        console.error('Erro ao obter token:', erro);
    }
}
// Função para buscar dados da planilha
async function fetchSheetData(range) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao carregar dados da planilha');
        }
        const data = await response.json();
        console.log('Dados carregados:', data);
        return data;
    } catch (erro) {
        console.error('Erro na requisição:', erro);
        throw erro;
    }
}
// Função para adicionar dados à planilha
async function appendSheetData(range, valores) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                values: valores,
            }),
        });

        if (!response.ok) {
            throw new Error('Erro ao enviar dados para a planilha.');
        }

        const data = await response.json();
        console.log('Dados enviados com sucesso:', data);
        return data;
    } catch (erro) {
        console.error('Erro ao enviar dados:', erro);
        throw erro;
    }
}
getAccessToken();

// Função para carregar as turmas
async function loadTurmas(containerId) {
    const listaTurmas = document.getElementById(containerId);
    if (!listaTurmas) {
        console.error(`Elemento com ID "${containerId}" não encontrado.`);
        return;
    }

    console.log('Elemento lista-turmas encontrado:', listaTurmas); // Log para depuração
    listaTurmas.innerHTML = '<p>Carregando turmas...</p>';

    try {
        const data = await fetchSheetData(TURMAS_RANGE);
        console.log('Dados das turmas:', data); // Log para depuração
        const turmas = data.values;

        if (turmas && turmas.length > 0) {
            listaTurmas.innerHTML = ''; // Limpa o conteúdo anterior
            turmas.forEach(turma => {
                const turmaDiv = document.createElement('div');
                turmaDiv.className = 'turma-item';
                turmaDiv.innerHTML = `
                    <span>${turma[1]}</span>
                `;
                // Adiciona o evento de clique para redirecionar
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

        // Carrega os alunos da turma
        const dataAlunos = await fetchSheetData(ALUNOS_RANGE);
        const alunos = dataAlunos.values.filter(row => row[2] === turmaId); // Filtra alunos pela turma

        if (alunos && alunos.length > 0) {
            listaAlunos.innerHTML = ''; // Limpa o conteúdo anterior
            alunos.forEach((aluno, index) => {
                const alunoDiv = document.createElement('div');
                alunoDiv.className = 'aluno-item';
                alunoDiv.setAttribute('data-id', index + 1); // ID autoincrementado (1, 2, 3, ...)
                alunoDiv.innerHTML = `
                    <span>${aluno[1]}</span>
                    <button class="btn-presenca" data-status="P">P</button>
                `;
                listaAlunos.appendChild(alunoDiv);
            });

            // Adiciona o evento de clique aos botões de presença
            const botoesPresenca = document.querySelectorAll('.btn-presenca');
            botoesPresenca.forEach(botao => {
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
            alert('Frequência para esta turma e data já foi registrada.');
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
async function appendSheetData(range, valores) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                values: valores,
            }),
        });

        if (!response.ok) {
            throw new Error('Erro ao enviar dados para a planilha.');
        }

        const data = await response.json();
        console.log('Dados enviados com sucesso:', data); // Log para depuração
        return data;
    } catch (erro) {
        console.error('Erro ao enviar dados:', erro);
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
document.getElementById('form-cadastro').addEventListener('submit', async function(event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value;
    const turmaId = document.getElementById('turma').value;

    if (!nome || !turmaId) {
        exibirMensagem('Preencha todos os campos!', 'erro');
        return;
    }

    try {
        // Carrega os alunos existentes para gerar o próximo ID
        const dataAlunos = await fetchSheetData(ALUNOS_RANGE);
        const proximoId = dataAlunos.values.length + 1; // Gera o próximo ID

        // Adiciona o aluno à planilha na ordem correta: ID, Nome, Turma
        await appendSheetData('Alunos!A2:C', [[proximoId, nome, turmaId]]);
        exibirMensagem('Aluno cadastrado com sucesso!', 'sucesso');
        document.getElementById('form-cadastro').reset(); // Limpa o formulário
    } catch (erro) {
        console.error('Erro ao cadastrar aluno:', erro);
        exibirMensagem('Erro ao cadastrar aluno. Verifique o console.', 'erro');
    }
});

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
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registrado com sucesso:', registration);
            })
            .catch((error) => {
                console.error('Erro ao registrar Service Worker:', error);
            });
    });
}
