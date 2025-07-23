import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { sheetsAPI, metadataAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  UserGroupIcon,
  AcademicCapIcon,
  StarIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');

  // Fetch featured sheets
  const { data: featuredSheets, isLoading: loadingSheets } = useQuery({
    queryKey: ['featuredSheets'],
    queryFn: () => sheetsAPI.getFeaturedSheets({ limit: 6 }),
  });

  // Fetch faculties
  const { data: faculties, isLoading: loadingFaculties } = useQuery({
    queryKey: ['faculties'],
    queryFn: () => metadataAPI.getFaculties(),
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleFacultySelect = (facultyId) => {
    window.location.href = `/shop/${facultyId}`;
  };

  const features = [
    {
      icon: DocumentTextIcon,
      title: 'Download Study Sheets',
      description: 'Access thousands of study materials from fellow students across all faculties.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: CloudArrowUpIcon,
      title: 'Upload & Earn',
      description: 'Share your study notes and earn money from your academic work.',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: UserGroupIcon,
      title: 'Study Groups',
      description: 'Find study partners and join groups with students in your courses.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: AcademicCapIcon,
      title: 'Quality Assured',
      description: 'All materials are reviewed and approved by our admin team for quality.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg section-padding">
        <div className="container-app">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              Welcome to{' '}
              <span className="text-gradient">KU SHEET</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 animate-fade-in animation-delay-200">
              The ultimate platform for university students to share and access study materials
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in animation-delay-400">
              <Link
                to="/shop"
                className="btn btn-primary btn-lg flex items-center space-x-2"
              >
                <DocumentTextIcon className="w-5 h-5" />
                <span>Start Downloading</span>
              </Link>
              <Link
                to="/seller"
                className="btn btn-outline btn-lg flex items-center space-x-2"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                <span>Start Uploading</span>
              </Link>
            </div>

            {/* Search Section */}
            <div className="max-w-2xl mx-auto animate-fade-in animation-delay-600">
              <div className="bg-white rounded-xl shadow-lg p-6 border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Search Study Materials
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by subject code or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="input pl-10 w-full"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="btn btn-primary btn-md"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-white">
        <div className="container-app">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose KU SHEET?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the features that make studying easier and more collaborative
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="text-center animate-fade-in"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.bgColor} rounded-full mb-6`}>
                    <Icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Sheets Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-app">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Featured Study Sheets
              </h2>
              <p className="text-xl text-gray-600">
                Popular materials from our community
              </p>
            </div>
            <Link
              to="/shop"
              className="btn btn-outline flex items-center space-x-2"
            >
              <span>View All</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {loadingSheets ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading featured sheets..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredSheets?.data?.data?.map((sheet) => (
                <Link
                  key={sheet.id}
                  to={`/infoSheet/${sheet.id}`}
                  className="sheet-card"
                >
                  {sheet.cover_image && (
                    <div className="h-48 bg-gray-200 rounded-t-xl overflow-hidden">
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/covers/${sheet.cover_image}`}
                        alt={sheet.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-primary-600 font-medium">
                        {sheet.subject_code}
                      </span>
                      <div className="flex items-center space-x-1">
                        <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-500">
                          {sheet.download_count} downloads
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {sheet.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {sheet.short_description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        by {sheet.Seller?.pen_name}
                      </span>
                      <span className="text-lg font-bold text-primary-600">
                        {sheet.is_free ? 'Free' : `฿${sheet.price}`}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Faculty Selector Section */}
      <section className="section-padding bg-white">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Browse by Faculty
            </h2>
            <p className="text-xl text-gray-600">
              Find study materials specific to your field of study
            </p>
          </div>

          {loadingFaculties ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading faculties..." />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {faculties?.data?.data?.map((faculty) => (
                <button
                  key={faculty.id}
                  onClick={() => handleFacultySelect(faculty.id)}
                  className="p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all duration-200 text-center group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:from-primary-200 group-hover:to-secondary-200 transition-colors">
                    <span className="text-primary-600 font-bold text-lg">
                      {faculty.code}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">
                    {faculty.name}
                  </h3>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="section-padding gradient-bg">
        <div className="container-app">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of students sharing knowledge and succeeding together
            </p>
            
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="btn btn-primary btn-lg"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="btn btn-outline btn-lg"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/shop"
                  className="btn btn-primary btn-lg"
                >
                  Browse Sheets
                </Link>
                {!user?.is_seller && (
                  <Link
                    to="/seller"
                    className="btn btn-outline btn-lg"
                  >
                    Become a Seller
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;