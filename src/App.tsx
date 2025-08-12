import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Onboarding from './pages/onboarding'
import OnboardingComplete from './pages/onboarding/complete'
import NewListing from './pages/listings/new'
import ListingPage from './pages/listings/[id]'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="p-8">
            <h1>Marketplace</h1>
            <nav className="mt-4 space-y-2">
              <div><a href="/onboarding" className="text-blue-600">Onboarding</a></div>
              <div><a href="/listings/new" className="text-blue-600">New Listing</a></div>
            </nav>
          </div>
        } />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/onboarding/complete" element={<OnboardingComplete />} />
        <Route path="/listings/new" element={<NewListing />} />
        <Route path="/listings/:id" element={<ListingPage />} />
        <Route path="/browse" element={<div className="p-8">Browse listings</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
