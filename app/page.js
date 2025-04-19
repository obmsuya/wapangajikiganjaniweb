"use client"
import React, { useState, useEffect } from 'react';
import { Home, Users, CreditCard, Shield, Menu, X, ChevronRight, Star, Check } from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState('landlords');

  // Animation for elements when they come into view
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });

    return () => {
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Home className="h-8 w-8 mr-2 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold">Wapangaji Kiganjani</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Features</a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Testimonials</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Pricing</a>
              <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Contact</a>
            </nav>
            
            {/* Login/Signup Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <a href="/login" className="py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">Log In</a>
              <a href="/signup" className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Sign Up</a>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
              <nav className="flex flex-col space-y-4">
                <a 
                  href="#features" 
                  className="px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#testimonials" 
                  className="px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Testimonials
                </a>
                <a 
                  href="#pricing" 
                  className="px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </a>
                <a 
                  href="#contact" 
                  className="px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </a>
                <div className="flex space-x-4 pt-2 border-t border-gray-200 dark:border-gray-800">
                  <a 
                    href="/login" 
                    className="flex-1 text-center py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log In
                  </a>
                  <a 
                    href="/signup" 
                    className="flex-1 text-center py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </a>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-20 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 transition-all duration-700 translate-y-8">
                Property Management Made Simple
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 transition-all duration-700 delay-300 translate-y-8">
                Streamline your rental property management with our all-in-one platform designed for landlords and tenants in Tanzania.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 transition-all duration-700 delay-500 translate-y-8">
                <a href="/signup" className="py-3 px-8 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-lg font-medium">
                  Get Started
                </a>
                <a href="#features" className="py-3 px-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-lg font-medium">
                  Learn More
                </a>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute bottom-0 left-0 w-full h-16 bg-white dark:bg-gray-900" style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%, 0% 100%)' }}></div>
        </section>
        
        {/* Feature Tabs Section */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 transition-all duration-700">
                Features for Everyone
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto ">
                Whether you're a landlord managing multiple properties or a tenant looking for a hassle-free rental experience, we've got you covered.
              </p>
            </div>
            
            {/* Feature tabs */}
            <div className="mb-12">
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <button 
                  className={`px-6 py-3 rounded-full text-lg font-medium transition-all ${activeFeature === 'landlords' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  onClick={() => setActiveFeature('landlords')}
                >
                  For Landlords
                </button>
                <button 
                  className={`px-6 py-3 rounded-full text-lg font-medium transition-all ${activeFeature === 'tenants' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  onClick={() => setActiveFeature('tenants')}
                >
                  For Tenants
                </button>
                <button 
                  className={`px-6 py-3 rounded-full text-lg font-medium transition-all ${activeFeature === 'managers' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  onClick={() => setActiveFeature('managers')}
                >
                  For Property Managers
                </button>
              </div>
              
              {/* Landlords features */}
              <div className={`transition-all duration-500 ${activeFeature === 'landlords' ? 'opacity-100' : 'opacity-0 hidden'}`}>
                <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
                  <div className="order-2 md:order-1">
                    <h3 className="text-2xl font-bold mb-6">Streamline Your Property Management</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Track rent payments and generate financial reports</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Manage multiple properties and units from one dashboard</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Communicate directly with tenants through the app</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Set automated rent reminders to ensure timely payments</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Track and manage maintenance requests efficiently</span>
                      </li>
                    </ul>
                  </div>
                  <div className="order-1 md:order-2 bg-blue-50 dark:bg-gray-800 rounded-xl p-6 h-80 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Users className="h-32 w-32 text-blue-500 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tenants features */}
              <div className={`transition-all duration-500 ${activeFeature === 'tenants' ? 'opacity-100' : 'opacity-0 hidden'}`}>
                <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
                  <div className="order-2 md:order-1">
                    <h3 className="text-2xl font-bold mb-6">Hassle-free Renting Experience</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Pay rent online with M-Pesa and other payment methods</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Submit maintenance requests with photos and descriptions</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Receive rent reminders and payment confirmations</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Access your rental history and payment receipts</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Communicate directly with your landlord or property manager</span>
                      </li>
                    </ul>
                  </div>
                  <div className="order-1 md:order-2 bg-purple-50 dark:bg-gray-800 rounded-xl p-6 h-80 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Home className="h-32 w-32 text-purple-500 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Managers features */}
              <div className={`transition-all duration-500 ${activeFeature === 'managers' ? 'opacity-100' : 'opacity-0 hidden'}`}>
                <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
                  <div className="order-2 md:order-1">
                    <h3 className="text-2xl font-bold mb-6">Efficient Property Management Tools</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Manage multiple properties for different landlords</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Collect rent and generate automated financial reports</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Handle maintenance requests and schedule repairs</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Screen potential tenants and manage lease agreements</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                        <span>Track performance metrics for each property</span>
                      </li>
                    </ul>
                  </div>
                  <div className="order-1 md:order-2 bg-green-50 dark:bg-gray-800 rounded-xl p-6 h-80 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Shield className="h-32 w-32 text-green-500 dark:text-green-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="bg-gray-50 dark:bg-gray-800 py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 transition-all duration-700">
                Why Choose Wapangaji Kiganjani?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto ">
                Our platform is designed specifically for the Tanzanian rental market, addressing the unique challenges faced by property owners and tenants.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Benefit 1 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm transition-all duration-700 delay-100">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Mobile Payments</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Integrated with M-Pesa and other mobile payment systems popular in Tanzania for seamless rent collection.
                </p>
              </div>
              
              {/* Benefit 2 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm ">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Bilingual Support</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Available in both English and Swahili, ensuring all users can comfortably navigate the platform.
                </p>
              </div>
              
              {/* Benefit 3 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm transition-all duration-700 delay-300">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Secure & Reliable</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Built with robust security measures to protect your data and financial transactions at all times.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 transition-all duration-700">
                What Our Users Say
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto ">
                Join hundreds of satisfied landlords and tenants who have streamlined their rental experience with Wapangaji Kiganjani.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-700 delay-100">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  "As a landlord with multiple properties, keeping track of rent payments was always a challenge. With Wapangaji Kiganjani, I can now monitor all my properties in one place and receive instant notifications when rent is paid."
                </p>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg mr-4">
                    JM
                  </div>
                  <div>
                    <h4 className="font-bold">John Makono</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Landlord, Dar es Salaam</p>
                  </div>
                </div>
              </div>
              
              {/* Testimonial 2 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-100 dark:border-gray-800 ">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  "Paying rent has never been easier! I just use M-Pesa through the app and get an instant receipt. I also love how I can report maintenance issues directly and track when they'll be resolved."
                </p>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-lg mr-4">
                    AH
                  </div>
                  <div>
                    <h4 className="font-bold">Amina Hassan</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tenant, Arusha</p>
                  </div>
                </div>
              </div>
              
              {/* Testimonial 3 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-700 delay-300">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  "As a property manager handling over 30 units, this app has been a game changer. The automated reporting and tenant communication features save me hours every week. Highly recommended!"
                </p>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 font-bold text-lg mr-4">
                    FM
                  </div>
                  <div>
                    <h4 className="font-bold">Frank Mwangi</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Property Manager, Mwanza</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pricing Section */}
        <section id="pricing" className="bg-gray-50 dark:bg-gray-800 py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 transition-all duration-700">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto ">
                Choose the plan that works best for your needs, with no hidden fees.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Basic Plan */}
              <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 transition-transform hover:scale-105 transition-all duration-700 delay-100">
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-2">Basic</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">Perfect for small landlords</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">Free</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">Up to 3 properties</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">Basic rent tracking</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">Tenant communication</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">Mobile payments</span>
                    </li>
                  </ul>
                  <a href="/signup" className="block text-center py-3 px-6 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium">
                    Get Started
                  </a>
                </div>
              </div>
              
                           {/* Standard Plan */}
                           <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg border-2 border-blue-500 dark:border-blue-400 relative transform scale-105 z-10 ">
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-2">Standard</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">Ideal for growing landlords</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$9.99</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">Unlimited properties</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">Advanced reporting</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">Maintenance tracking</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">Priority support</span>
                    </li>
                  </ul>
                  <a href="/signup" className="block text-center py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
                    Choose Plan
                  </a>
                </div>
              </div>
              {/* Pro Plan */}
              <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 transition-transform hover:scale-105 transition-all duration-700 delay-300">
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-2">Pro</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">Best for property managers</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$19.99</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">All Standard features</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">Tenant screening</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">Lease management</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">Custom branding</span>
                    </li>
                  </ul>
                  <a href="/signup" className="block text-center py-3 px-6 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium">
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
                {/* Contact Section */}
                <section id="contact" className="py-20 bg-gradient-to-br from-indigo-100 to-blue-50 dark:from-gray-800 dark:to-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 transition-all duration-700">
                Get in Touch
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto ">
                Have questions or need help? Our team is here to assist you.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <div className="transition-all duration-700 delay-100">
                <h3 className="text-2xl font-bold mb-6">Send Us a Message</h3>
                <form className="space-y-6">
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input 
                    type="email" 
                    placeholder="Your Email" 
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea 
                    placeholder="Your Message" 
                    rows={4} 
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    type="submit" 
                    className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Submit
                  </button>
                </form>
              </div>
              {/* Contact Info */}
              <div className="">
                <h3 className="text-2xl font-bold mb-6">Our Contact Details</h3>
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <Home className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" />
                    <span>Dar es Salaam, Tanzania</span>
                  </li>
                  <li className="flex items-center">
                    <CreditCard className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" />
                    <span>+255 7XX XXX XXX</span>
                  </li>
                  <li className="flex items-center">
                    <Shield className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" />
                    <span>support@wapangaji.com</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <h4 className="text-xl font-bold mb-4">Follow Us</h4>
                  <div className="flex space-x-4">
                    <a href="#" className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                      <ChevronRight className="h-6 w-6" />
                    </a>
                    <a href="#" className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                      <Star className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
                {/* Footer */}
                <footer className="py-12 bg-gray-900 text-gray-300">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              {/* About Us */}
              <div>
                <h4 className="text-lg font-bold mb-4">About Us</h4>
                <p className="text-sm">
                  Wapangaji Kiganjani simplifies property management for landlords, tenants, and property managers in Tanzania.
                </p>
              </div>
              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><a href="#features" className="hover:text-blue-400">Features</a></li>
                  <li><a href="#testimonials" className="hover:text-blue-400">Testimonials</a></li>
                  <li><a href="#pricing" className="hover:text-blue-400">Pricing</a></li>
                  <li><a href="#contact" className="hover:text-blue-400">Contact</a></li>
                </ul>
              </div>
              {/* Resources */}
              <div>
                <h4 className="text-lg font-bold mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-blue-400">Blog</a></li>
                  <li><a href="#" className="hover:text-blue-400">Help Center</a></li>
                  <li><a href="#" className="hover:text-blue-400">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-blue-400">Terms of Service</a></li>
                </ul>
              </div>
              {/* Newsletter */}
              <div>
                <h4 className="text-lg font-bold mb-4">Subscribe to Our Newsletter</h4>
                <form className="flex space-x-2">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md focus:outline-none"
                  />
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
            <div className="mt-12 border-t border-gray-700 pt-6 text-center">
              <p className="text-sm">
                © 2023 Wapangaji Kiganjani. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}