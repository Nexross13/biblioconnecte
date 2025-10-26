import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

const Layout = () => (
  <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
    <Navbar />
    <main className="mx-auto mt-6 w-full max-w-7xl flex-1 px-4 md:px-6">
      <Outlet />
    </main>
    <Footer />
  </div>
)

export default Layout
