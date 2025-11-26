import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Home from './pages/Home';
import ShopProducts from './pages/ShopProducts';
import Details from './pages/Details';
import Contact from './pages/Contact';
import Branches from './pages/Branches';
import Cart from './pages/Cart';
import Auth from './pages/Auth';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ShopProducts />} />
            <Route path="/details" element={<Details />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/auth/*" element={<Auth />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
