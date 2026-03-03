import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ServerProvider } from './ServerContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Drivers from './pages/Drivers';
import Calendar from './pages/Calendar';
import Results from './pages/Results';
import Subscribe from './pages/Subscribe';

function App() {
    return (
        <BrowserRouter>
            <ServerProvider>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/drivers" element={<Drivers />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/results" element={<Results />} />
                    <Route path="/subscribe" element={<Subscribe />} />
                </Routes>
                <Footer />
            </ServerProvider>
        </BrowserRouter>
    );
}

export default App;
