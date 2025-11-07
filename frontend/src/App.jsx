import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPasswordRequest from './pages/ForgotPasswordRequest.jsx'
import ForgotPasswordReset from './pages/ForgotPasswordReset.jsx'
import Library from './pages/Library.jsx'
import BookDetails from './pages/BookDetails.jsx'
import BookProposalDetails from './pages/BookProposalDetails.jsx'
import BookProposalForm from './pages/BookProposalForm.jsx'
import AuthorForm from './pages/AuthorForm.jsx'
import AuthorProposalDetails from './pages/AuthorProposalDetails.jsx'
import AuthorDetails from './pages/AuthorDetails.jsx'
import Profile from './pages/Profile.jsx'
import Friends from './pages/Friends.jsx'
import FriendCollection from './pages/FriendCollection.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Unauthorized from './pages/Unauthorized.jsx'
import NotFound from './pages/NotFound.jsx'

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/books/:id" element={<BookDetails />} />
      <Route path="/authors/:id" element={<AuthorDetails />} />
      <Route
        path="/books/new"
        element={
          <ProtectedRoute>
            <BookProposalForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/authors/new"
        element={
          <ProtectedRoute>
            <AuthorForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <Library />
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends"
        element={
          <ProtectedRoute>
            <Friends />
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends/:id/collection"
        element={
          <ProtectedRoute>
            <FriendCollection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/book-proposals/:id"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <BookProposalDetails />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/author-proposals/:id"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AuthorProposalDetails />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
      <Route path="/forgot-password/reset" element={<ForgotPasswordReset />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
)

export default App
