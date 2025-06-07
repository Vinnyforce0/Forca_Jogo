let palavras = []
let mascara = []
let letrasErradas = new Set()
let letrasErradasPos = {}
let possibilidadesPorPosicao = []

async function iniciarRodada() {
  const tamanho = parseInt(document.getElementById('tamanho').value)
  if (!tamanho || tamanho < 1) return

  const res = await fetch('words_alpha.txt')
  const todas = await res.json()
  palavras = todas.filter(p => p.length === tamanho)

  mascara = Array(tamanho).fill('_')
  letrasErradas = new Set()
  letrasErradasPos = {}
  possibilidadesPorPosicao = Array(tamanho).fill().map(() => new Set('abcdefghijklmnopqrstuvwxyz'))

  document.getElementById('jogo').style.display = 'block'
  atualizarInterface()
}

function atualizarInterface() {
  document.getElementById('mascara').textContent = mascara.join(' ')
  document.getElementById('letrasErradas').textContent = [...letrasErradas].join(' ')
  mostrarPossibilidades()
  sugerirLetras()
}

function processarEntrada() {
  const entrada = document.getElementById('entrada').value.trim().toLowerCase()
  document.getElementById('entrada').value = ''
  if (!entrada) return

  if (entrada === '?') {
    mostrarPossibilidades()
    sugerirLetras()
    return
  }

  if (entrada.startsWith('s ')) {
    const [_, posStr, letra] = entrada.split(' ')
    const pos = parseInt(posStr) - 1
    if (pos >= 0 && pos < mascara.length) {
      mascara[pos] = letra
      possibilidadesPorPosicao[pos] = new Set([letra])
    }
  } else if (/^[a-z]$/.test(entrada)) {
    const letra = entrada
    if (mascara.includes(letra)) {
      for (let i = 0; i < mascara.length; i++) {
        if (mascara[i] === '_') {
          if (!letrasErradasPos[letra]) letrasErradasPos[letra] = new Set()
          letrasErradasPos[letra].add(i)
          possibilidadesPorPosicao[i].delete(letra)
        }
      }
    } else {
      letrasErradas.add(letra)
      for (let i = 0; i < mascara.length; i++) {
        if (mascara[i] === '_') {
          possibilidadesPorPosicao[i].delete(letra)
        }
      }
    }
  }
  atualizarInterface()
}

function filtrarPalavras() {
  return palavras.filter(p => {
    if (p.length !== mascara.length) return false
    for (let i = 0; i < p.length; i++) {
      if (mascara[i] !== '_' && p[i] !== mascara[i]) return false
      if (mascara[i] === '_' && !possibilidadesPorPosicao[i].has(p[i])) return false
    }
    for (const letra of letrasErradas) {
      if (p.includes(letra)) return false
    }
    for (const letra in letrasErradasPos) {
      for (const pos of letrasErradasPos[letra]) {
        if (p[pos] === letra) return false
      }
    }
    return true
  })
}

function mostrarPossibilidades() {
  const possiveis = filtrarPalavras()
  const limitadas = possiveis.slice(0, 10)
  const html = `<strong>Possibilidades (${limitadas.length} de ${possiveis.length}):</strong><ul>` +
               limitadas.map(p => `<li>${p}</li>`).join('') +
               (possiveis.length > 10 ? '<li>...</li>' : '') + '</ul>'
  document.getElementById('possibilidades').innerHTML = html
}

function sugerirLetras() {
  const possiveis = filtrarPalavras()
  const contagem = {}
  const letrasConhecidas = new Set(mascara.filter(l => l !== '_'))
  const proibidas = new Set([...letrasConhecidas, ...letrasErradas])
  const posVazias = mascara.map((c, i) => c === '_' ? i : -1).filter(i => i !== -1)

  for (const p of possiveis) {
    const usadas = new Set()
    for (const i of posVazias) {
      const l = p[i]
      if (!usadas.has(l)) {
        contagem[l] = (contagem[l] || 0) + 1
        usadas.add(l)
      }
    }
  }

  const sugestoes = Object.entries(contagem)
    .filter(([letra]) => !proibidas.has(letra))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const html = `<strong>🔠 Letras sugeridas:</strong><ul>` +
               sugestoes.map(([l, c]) => `<li>${l.toUpperCase()} (${c})</li>`).join('') + '</ul>'
  document.getElementById('sugestoes').innerHTML = html
}
