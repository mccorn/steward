import { Route, Routes } from 'react-router'
import './App.css'
import { ShopListPage } from './pages/ShopListPage/ShopListPage'
import { ReputationPage } from './pages/ReputationPage/ReputationPage'
import { ROUTES } from './const/routes'
import { HomePage } from './pages/HomePage/HomePage'
import { ListSettingsPage } from './pages/ListSettingsPage/ListSettingsPage'
import { AuthProvider } from './context/AuthContext'
import { NetworkProvider } from './context/NetworkContext'
import { StoreProvider } from './context/StoreContext'

function App() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <StoreProvider>
          <Routes>
            <Route path={ROUTES.homePage.url} element={<HomePage />} />
            <Route path={ROUTES.shopListPage.url} element={<ShopListPage />} />
            <Route path={ROUTES.reputationPage.url} element={<ReputationPage />} />
            <Route path={ROUTES.listNew.url} element={<ListSettingsPage mode="create" />} />
            <Route path="/lists/:listId/settings" element={<ListSettingsPage />} />
            <Route path="/lists/:listId" element={<ShopListPage />} />
          </Routes>
        </StoreProvider>
      </NetworkProvider>
    </AuthProvider>
  )
}

export default App
