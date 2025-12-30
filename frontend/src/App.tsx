import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/layout'
import { ProtectedRoute } from './components/common'
import {
  Home,
  Problems,
  ProblemDetail,
  Contests,
  Leaderboard,
  Solutions,
  SolutionDetail,
  CreateSolution,
  Profile,
  Login,
  Register,
  NotFound,
  OAuthCallback,
  Submissions,
} from './pages'
import { MathTest } from './pages/MathTest'
import { SimpleTest } from './pages/SimpleTest'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="problems" element={<Problems />} />
            <Route path="problems/:id" element={<ProblemDetail />} />
            <Route path="submissions" element={<Submissions />} />
            <Route path="contests" element={<Contests />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="solutions" element={<Solutions />} />
            <Route path="solutions/new" element={
              <ProtectedRoute>
                <CreateSolution />
              </ProtectedRoute>
            } />
            <Route path="solutions/:id" element={<SolutionDetail />} />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="math-test" element={<MathTest />} />
            <Route path="simple-test" element={<SimpleTest />} />
            <Route path="oauth/callback" element={<OAuthCallback />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>

    </QueryClientProvider>
  )
}

export default App
