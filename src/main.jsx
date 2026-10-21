import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App.jsx';
import { ProveedorAvisos } from './contexto/ProveedorAvisos.jsx';
import { ProveedorConfirmacion } from './contexto/ProveedorConfirmacion.jsx';
import { ProveedorSesion } from './contexto/ProveedorSesion.jsx';
import './estilos/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorAvisos>
        <ProveedorConfirmacion>
          <ProveedorSesion>
            <App />
          </ProveedorSesion>
        </ProveedorConfirmacion>
      </ProveedorAvisos>
    </BrowserRouter>
  </StrictMode>,
);
