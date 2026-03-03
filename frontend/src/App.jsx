import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Drivers from './pages/Drivers';
import Calendar from './pages/Calendar';
import Results from './pages/Results';

function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/results" element={<Results />} />
            </Routes>
            <Footer />
        </BrowserRouter>
    );
}

export default App;
