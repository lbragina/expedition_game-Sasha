import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Mise à jour automatique : le nouveau service worker prend la main tout seul (autoUpdate),
// puis on recharge la page pour que Sasha voie tout de suite la nouvelle version.
const hadController = !!navigator.serviceWorker?.controller
let reloading = false
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (!hadController || reloading) return // première installation : rien à recharger
  reloading = true
  window.location.reload()
})

registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return
    // Cherche une nouvelle version à chaque retour dans l'appli (iPhone : l'appli reste souvent « en veille ») et toutes les 30 min.
    const check = () => reg.update().catch(() => {})
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
    setInterval(check, 30 * 60 * 1000)
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
