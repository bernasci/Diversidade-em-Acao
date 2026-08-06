import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ProvedorAvisos } from './componentes/avisos'
import { ProvedorEstado } from './nucleo/estado'

import './estilo/tokens.css'
import './estilo/base.css'
import './estilo/componentes.css'
import './estilo/jogos.css'

const raiz = document.getElementById('raiz')
if (!raiz) throw new Error('Elemento #raiz não encontrado no index.html')

createRoot(raiz).render(
  <StrictMode>
    <ProvedorAvisos>
      <ProvedorEstado>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ProvedorEstado>
    </ProvedorAvisos>
  </StrictMode>,
)
