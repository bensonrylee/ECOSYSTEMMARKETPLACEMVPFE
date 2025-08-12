import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/home'
import Onboarding from './pages/onboarding'
import OnboardingComplete from './pages/onboarding/complete'
import NewListing from './pages/listings/new'
import ListingPage from './pages/listings/[id]'
import BookingSuccess from './pages/bookings/[id]/success'
import Terms from './pages/terms'
import Privacy from './pages/privacy'
import Browse from './pages/browse'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="onboarding/complete" element={<OnboardingComplete />} />
          <Route path="listings/new" element={<NewListing />} />
          <Route path="listings/:id" element={<ListingPage />} />
          <Route path="bookings/:id/success" element={<BookingSuccess />} />
          <Route path="browse" element={<Browse />} />
          <Route path="terms" element={<Terms />} />
          <Route path="privacy" element={<Privacy />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
