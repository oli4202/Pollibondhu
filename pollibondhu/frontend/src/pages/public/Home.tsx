import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Users, CheckCircle, MapPin, Search, Store, Heart, Shield, Smartphone, ArrowRight, Star, ChevronRight } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function Home() {
  return (
    <div className="w-full">
      {/* ============================================================
          HERO SECTION — staggered entrance animations on load
          ============================================================ */}
      <section className="relative bg-gradient-to-br from-earth-50 via-white to-polli-50 min-h-[90vh] flex flex-col md:flex-row items-center justify-between px-6 py-16 md:px-20 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-polli-200/30 rounded-full blur-3xl pointer-events-none hero-anim-rotate" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl pointer-events-none hero-anim-rotate" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />

        {/* ---- Left: Text content ---- */}
        <div className="md:w-[55%] z-10 space-y-8 max-w-2xl">
          {/* Badge */}
          <div className="hero-anim-fade-up hero-delay-1">
            <div className="inline-flex items-center gap-2 bg-polli-100 text-polli-700 px-4 py-2 rounded-full text-sm font-semibold border border-polli-200">
              <span className="w-2 h-2 rounded-full bg-polli-500 animate-pulse" />
              Connected village life
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3 hero-anim-fade-up hero-delay-2">
            <h1 className="text-5xl md:text-7xl font-bold text-earth-900 tracking-tight leading-tight">
              পল্লীবন্ধু
            </h1>
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-polli-600 to-polli-700 bg-clip-text text-transparent">
              PolliBondhu
            </h2>
          </div>

          {/* Description */}
          <div className="space-y-3 hero-anim-fade-up hero-delay-3">
            <h3 className="text-xl md:text-2xl font-semibold text-earth-800">
              আপনার গ্রামের সেবাগুলো, হাতের মুঠোয়।
            </h3>
            <p className="text-lg text-earth-500 leading-relaxed max-w-lg">
              Agriculture, health, education, emergency help, and your community — one simple place to begin.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2 hero-anim-fade-up hero-delay-4">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-polli-600 hover:bg-polli-700 text-white font-bold rounded-xl text-lg transition-all shadow-lg shadow-polli-600/25 hover:shadow-xl hover:shadow-polli-600/30 hover:-translate-y-0.5"
            >
              নিবন্ধন করুন — Register Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-earth-50 text-earth-700 font-bold rounded-xl text-lg border-2 border-earth-200 hover:border-earth-300 transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-6 pt-4 text-sm text-earth-500 hero-anim-fade-up hero-delay-5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-polli-600" />
              <span>Government Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-polli-600" />
              <span>Mobile Friendly</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-polli-600" />
              <span>Free Forever</span>
            </div>
          </div>
        </div>

        {/* ---- Right: Image with floating cards ---- */}
        <div className="md:w-[45%] mt-16 md:mt-0 relative z-10 flex justify-center">
          <div className="relative hero-anim-scale-in hero-delay-3">
            {/* Main image */}
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-earth-200/50 w-full max-w-[520px]">
              <img
                src="https://tse3.mm.bing.net/th/id/OIP.rCXl0qzvWJe4frGftb5VGgHaE6?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"
                alt="Beautiful rural Bangladesh landscape"
                className="w-full h-[400px] md:h-[460px] object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Floating card 1 - Users (floats gently) */}
            <div className="absolute -bottom-6 -left-8 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-earth-100 hero-anim-fade-left hero-delay-7 hero-anim-float">
              <div className="p-3 bg-polli-100 text-polli-600 rounded-xl">
                <Users size={22} />
              </div>
              <div>
                <p className="text-xs text-earth-400 font-medium">Active Today</p>
                <p className="font-bold text-earth-800 text-lg">12,480 Users</p>
              </div>
            </div>

            {/* Floating card 2 - Rating (floats with delay) */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-2 border border-earth-100 hero-anim-fade-right hero-delay-8 hero-anim-float-delay">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm font-semibold text-earth-700">4.9</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          STATS SECTION — scroll-reveal with stagger
          ============================================================ */}
      <section className="py-16 bg-white border-y border-earth-100">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { number: '2.4M+', label: 'Registered Citizens', color: 'text-polli-600' },
            { number: '64', label: 'Districts Reached', color: 'text-amber-600' },
            { number: '480+', label: 'Services Available', color: 'text-blue-600' },
            { number: '98%', label: 'User Satisfaction', color: 'text-rose-500' },
          ].map((stat, i) => (
            <ScrollReveal key={i} variant="fade-up" delay={i * 120}>
              <div className="text-center p-6 rounded-2xl bg-earth-50/50 hover:bg-earth-50 transition-colors">
                <p className={`text-4xl font-bold ${stat.color} mb-2 hero-anim-count`}>{stat.number}</p>
                <p className="text-sm text-earth-500 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ============================================================
          FEATURES SECTION — scroll-reveal cards
          ============================================================ */}
      <section className="py-24 bg-gradient-to-b from-white to-earth-50">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal variant="fade-up">
            <div className="text-center mb-16">
              <span className="inline-block bg-polli-100 text-polli-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">Why PolliBondhu?</span>
              <h2 className="text-3xl md:text-5xl font-bold text-earth-900 mb-4">Everything You Need, In One Place</h2>
              <p className="text-lg text-earth-500 max-w-2xl mx-auto">
                From agriculture to healthcare, government services to education — PolliBondhu connects rural Bangladesh to the digital world.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Sprout className="w-7 h-7" />,
                title: 'Agriculture Advisory',
                desc: 'Get crop advice, live market prices, weather forecasts, and fertilizer recommendations tailored to your region.',
                image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
                color: 'from-amber-500 to-orange-600',
              },
              {
                icon: <MapPin className="w-7 h-7" />,
                title: 'Government Services',
                desc: 'Apply for birth certificates, trade licenses, NID cards, and more — all from your phone without traveling to the city.',
                image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
                color: 'from-stone-500 to-stone-700',
              },
              {
                icon: <Heart className="w-7 h-7" />,
                title: 'Healthcare Access',
                desc: 'Schedule vaccinations, find blood donors, book ambulances, and access health records for your family.',
                image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
                color: 'from-rose-500 to-red-600',
              },
            ].map((feature, i) => (
              <ScrollReveal key={i} variant="fade-up" delay={i * 150}>
                <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-earth-100 hover:-translate-y-1 h-full">
                  <div className="relative h-48 overflow-hidden">
                    <img src={feature.image} alt={feature.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${feature.color} opacity-60`} />
                    <div className="absolute bottom-4 left-4">
                      <div className="p-3 bg-white/90 backdrop-blur rounded-xl text-white">
                        {feature.icon}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-earth-900 mb-2">{feature.title}</h3>
                    <p className="text-earth-500 leading-relaxed text-sm">{feature.desc}</p>
                    <Link to="/register" className="inline-flex items-center gap-2 text-polli-600 font-semibold mt-4 text-sm hover:gap-3 transition-all">
                      Learn more <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          VILLAGE MARKET CTA — scroll-reveal
          ============================================================ */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal variant="scale-in">
            <div className="bg-gradient-to-br from-earth-800 to-earth-900 rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-polli-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="md:w-1/2 z-10">
                <ScrollReveal variant="fade-left" delay={200}>
                  <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-amber-500/30">
                    🏪 New Feature
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">গ্রামীণ বাজার</h2>
                  <h3 className="text-2xl md:text-3xl font-bold text-polli-400 mb-6">Village Market</h3>
                  <p className="text-earth-300 text-lg leading-relaxed mb-8">
                    Buy, sell, and rent directly within your community. List your crops, equipment, land, or anything you need — no middlemen, no hassle.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/village-market"
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-polli-600 hover:bg-polli-500 text-white font-bold rounded-xl text-lg transition-all shadow-lg hover:shadow-xl"
                    >
                      <Store size={20} /> Browse Market
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-lg transition-all"
                    >
                      Post Your First Listing — Free
                    </Link>
                  </div>
                </ScrollReveal>
              </div>

              <div className="md:w-1/2 z-10">
                <ScrollReveal variant="fade-right" delay={300}>
              <img
                src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Rural agriculture market scene"
                className="w-full h-80 object-cover rounded-2xl shadow-2xl border border-earth-700"
              />
                </ScrollReveal>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS — scroll-reveal with stagger
          ============================================================ */}
      <section className="py-24 bg-earth-50">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal variant="fade-up">
            <div className="text-center mb-16">
              <span className="inline-block bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">Simple & Easy</span>
              <h2 className="text-3xl md:text-5xl font-bold text-earth-900 mb-4">How PolliBondhu Works</h2>
              <p className="text-lg text-earth-500 max-w-xl mx-auto">Three simple steps to access all government and community services</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-24 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-polli-300 via-amber-300 to-rose-300 hero-anim-bar hero-delay-6" />

            {[
              { step: '01', title: 'Create Account', desc: 'Register with your phone number and basic details. It takes less than 2 minutes.', icon: <Users className="w-6 h-6" /> },
              { step: '02', title: 'Choose Service', desc: 'Browse government services, market prices, healthcare, or community features.', icon: <Search className="w-6 h-6" /> },
              { step: '03', title: 'Get Results', desc: 'Submit applications, track progress, and receive updates — all from your phone.', icon: <CheckCircle className="w-6 h-6" /> },
            ].map((item, i) => (
              <ScrollReveal key={i} variant="scale-in" delay={i * 180}>
                <div className="relative text-center z-10">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white shadow-lg flex items-center justify-center text-polli-600 border border-polli-100 transition-transform hover:scale-110 hover:shadow-xl">
                    {item.icon}
                  </div>
                  <span className="text-sm font-bold text-polli-500 bg-polli-50 px-3 py-1 rounded-full">Step {item.step}</span>
                  <h3 className="text-xl font-bold text-earth-900 mt-4 mb-2">{item.title}</h3>
                  <p className="text-earth-500 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          TESTIMONIALS — scroll-reveal with stagger
          ============================================================ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal variant="fade-up">
            <div className="text-center mb-16">
              <span className="inline-block bg-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">Testimonials</span>
              <h2 className="text-3xl md:text-5xl font-bold text-earth-900 mb-4">Loved by Rural Bangladesh</h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'রহিমা বেগম',
                role: 'Farmer, Rangpur',
                text: 'PolliBondhu helped me find the best market prices for my rice. I earn 20% more now!',
                avatar: '👩‍🌾',
              },
              {
                name: 'কামাল হোসেন',
                role: 'Teacher, Sylhet',
                text: "Applied for my son's birth certificate from home. No more traveling to the city office!",
                avatar: '👨‍🏫',
              },
              {
                name: 'সাবিনা আক্তার',
                role: 'Small Business Owner, Dhaka',
                text: 'The village market feature lets me sell my handmade products directly to customers.',
                avatar: '👩‍💼',
              },
            ].map((testimonial, i) => (
              <ScrollReveal key={i} variant="fade-up" delay={i * 150}>
                <div className="bg-earth-50 rounded-2xl p-8 border border-earth-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="flex mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={16} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-earth-600 leading-relaxed mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{testimonial.avatar}</span>
                    <div>
                      <p className="font-bold text-earth-800">{testimonial.name}</p>
                      <p className="text-sm text-earth-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA — scroll-reveal
          ============================================================ */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-polli-600 via-polli-700 to-emerald-800" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center text-white space-y-6">
          <ScrollReveal variant="fade-up">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">আজই যোগ দিন<br />বিনামূল্যে</h2>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={150}>
            <p className="text-xl text-polli-100">Join 2.4 million citizens already using PolliBondhu</p>
          </ScrollReveal>
          <ScrollReveal variant="scale-in" delay={300}>
            <div className="pt-6">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                Register Now — বিনামূল্যে নিবন্ধন
                <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
