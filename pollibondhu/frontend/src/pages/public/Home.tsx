import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Users, CheckCircle, MapPin, Search } from 'lucide-react';

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section (Pg 1) */}
      <section className="bg-[#00A63C] text-white min-h-[90vh] flex flex-col md:flex-row items-center justify-between px-6 py-12 md:px-20 overflow-hidden relative">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="md:w-1/2 z-10 space-y-8 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium border border-white/30 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-300"></span> গ্রামীণ বাংলাদেশের ডিজিটাল বন্ধু
          </div>
          
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">পল্লীবন্ধু</h1>
            <h2 className="text-4xl md:text-6xl font-bold text-amber-400">PolliBondhu</h2>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Your Digital Gateway to Rural Services</h3>
            <p className="text-lg text-emerald-50 leading-relaxed max-w-md">
              Access government services, agriculture support, and community resources from your phone — without leaving your village.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to="/register" className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-lg text-center transition-colors shadow-lg">
              নিবন্ধন করুন — Register Free
            </Link>
            <Link to="/login" className="px-8 py-3.5 bg-emerald-600 border-2 border-emerald-400 hover:bg-emerald-500 text-white font-bold rounded-lg text-lg text-center transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        <div className="md:w-1/2 mt-12 md:mt-0 relative z-10 flex justify-end">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-emerald-500 max-w-[600px] w-full aspect-video md:aspect-square lg:aspect-[4/3]">
            <img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Agriculture field" className="w-full h-full object-cover" />
            
            <div className="absolute bottom-4 left-4 bg-white text-gray-900 px-4 py-3 rounded-xl flex items-center gap-3 shadow-xl">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Active Today</p>
                <p className="font-bold">12,480 Users</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section (Pg 2) */}
      <section className="py-16 bg-emerald-50">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-emerald-200/50">
          <div>
            <p className="text-3xl font-bold text-emerald-700 mb-1">2.4M+</p>
            <p className="text-xs text-emerald-900/60 font-medium uppercase tracking-wider">Registered Citizens</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-700 mb-1">64</p>
            <p className="text-xs text-emerald-900/60 font-medium uppercase tracking-wider">Districts Reached</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-700 mb-1">480+</p>
            <p className="text-xs text-emerald-900/60 font-medium uppercase tracking-wider">Services Available</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-700 mb-1">98%</p>
            <p className="text-xs text-emerald-900/60 font-medium uppercase tracking-wider">User Satisfaction</p>
          </div>
        </div>
      </section>

      {/* Call to Action (Pg 4) */}
      <section className="bg-[#00A63C] text-white py-24 text-center">
        <div className="max-w-2xl mx-auto px-6 space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">আজই যোগ দিন বিনামূল্যে</h2>
          <p className="text-xl text-emerald-100">Join 2.4 million citizens already using PolliBondhu</p>
          <div className="pt-8">
            <Link to="/register" className="inline-block px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xl transition-colors shadow-xl">
              Register Now — বিনামূল্যে নিবন্ধন
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
