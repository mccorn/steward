import { Route, Routes } from 'react-router'
import './App.css'
import { ShopListPage } from './pages/ShopListPage/ShopListPage'
import { ReputationPage } from './pages/ReputationPage/ReputationPage'
import { ROUTES } from './const/routes'
import { HomePage } from './pages/HomePage/HomePage'

function App() {
  return (
    <>
      <Routes>
        <Route path={ROUTES.homePage.url} element={<HomePage />} />
        <Route path={ROUTES.shopListPage.url} element={<ShopListPage />} />
        <Route path={ROUTES.reputationPage.url} element={<ReputationPage />} />
      </Routes>
    </>
  )
}

export default App
