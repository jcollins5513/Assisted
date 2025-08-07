'use client';

import React, { useState, useEffect } from 'react';

export interface MarketingTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  fields: TemplateField[];
  example: string;
  tags: string[];
}

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface TemplateSelectorProps {
  onTemplateSelect: (template: MarketingTemplate) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onTemplateSelect }) => {
  const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock templates data - in real app, this would come from API
  const mockTemplates: MarketingTemplate[] = [
    {
      id: 'just-arrived',
      name: 'Just Arrived',
      description: 'New vehicle arrival announcement',
      category: 'inventory',
      icon: '🚗',
      tags: ['new', 'arrival', 'inventory'],
      fields: [
        { name: 'vehicleMake', label: 'Vehicle Make', type: 'text', required: true, placeholder: 'e.g., Honda' },
        { name: 'vehicleModel', label: 'Vehicle Model', type: 'text', required: true, placeholder: 'e.g., Civic' },
        { name: 'year', label: 'Year', type: 'number', required: true, placeholder: 'e.g., 2024' },
        { name: 'price', label: 'Price', type: 'text', required: true, placeholder: 'e.g., $28,500' },
        { name: 'features', label: 'Key Features', type: 'textarea', required: false, placeholder: 'e.g., Apple CarPlay, Honda Sensing' }
      ],
      example: '🚗 Just arrived! 2024 Honda Civic EX-L in Crystal Black Pearl. Only $28,500! Features include Apple CarPlay, Honda Sensing, and premium audio system. Call us today!'
    },
    {
      id: 'managers-special',
      name: 'Manager\'s Special',
      description: 'Limited time special offers',
      category: 'promotions',
      icon: '🔥',
      tags: ['special', 'offer', 'limited-time'],
      fields: [
        { name: 'vehicleMake', label: 'Vehicle Make', type: 'text', required: true, placeholder: 'e.g., Toyota' },
        { name: 'vehicleModel', label: 'Vehicle Model', type: 'text', required: true, placeholder: 'e.g., Camry' },
        { name: 'year', label: 'Year', type: 'number', required: true, placeholder: 'e.g., 2023' },
        { name: 'originalPrice', label: 'Original Price', type: 'text', required: true, placeholder: 'e.g., $32,000' },
        { name: 'salePrice', label: 'Sale Price', type: 'text', required: true, placeholder: 'e.g., $28,500' },
        { name: 'endDate', label: 'Offer End Date', type: 'text', required: true, placeholder: 'e.g., Friday' }
      ],
      example: '🔥 MANAGER\'S SPECIAL! 2023 Toyota Camry LE was $32,000, now only $28,500! This offer ends Friday. Don\'t miss out on this incredible deal!'
    },
    {
      id: 'financing-offer',
      name: 'Financing Offer',
      description: 'Special financing promotions',
      category: 'financing',
      icon: '💳',
      tags: ['financing', 'payment', 'credit'],
      fields: [
        { name: 'vehicleMake', label: 'Vehicle Make', type: 'text', required: true, placeholder: 'e.g., Ford' },
        { name: 'vehicleModel', label: 'Vehicle Model', type: 'text', required: true, placeholder: 'e.g., Escape' },
        { name: 'year', label: 'Year', type: 'number', required: true, placeholder: 'e.g., 2024' },
        { name: 'monthlyPayment', label: 'Monthly Payment', type: 'text', required: true, placeholder: 'e.g., $299' },
        { name: 'term', label: 'Term (months)', type: 'number', required: true, placeholder: 'e.g., 60' },
        { name: 'downPayment', label: 'Down Payment', type: 'text', required: true, placeholder: 'e.g., $0' }
      ],
      example: '💳 Special financing available! 2024 Ford Escape SEL for only $299/month for 60 months with $0 down! Perfect credit not required. Apply today!'
    },
    {
      id: 'test-drive',
      name: 'Test Drive Invitation',
      description: 'Invite customers for test drives',
      category: 'engagement',
      icon: '🎯',
      tags: ['test-drive', 'invitation', 'engagement'],
      fields: [
        { name: 'vehicleMake', label: 'Vehicle Make', type: 'text', required: true, placeholder: 'e.g., Hyundai' },
        { name: 'vehicleModel', label: 'Vehicle Model', type: 'text', required: true, placeholder: 'e.g., Tucson' },
        { name: 'year', label: 'Year', type: 'number', required: true, placeholder: 'e.g., 2024' },
        { name: 'location', label: 'Location', type: 'text', required: true, placeholder: 'e.g., 123 Main St' },
        { name: 'contactInfo', label: 'Contact Info', type: 'text', required: true, placeholder: 'e.g., (555) 123-4567' }
      ],
      example: '🚗 Ready for a test drive? Come experience the 2024 Hyundai Tucson Limited! Visit us at 123 Main St or call (555) 123-4567 to schedule your appointment.'
    },
    {
      id: 'service-reminder',
      name: 'Service Reminder',
      description: 'Service appointment reminders',
      category: 'service',
      icon: '🔧',
      tags: ['service', 'maintenance', 'reminder'],
      fields: [
        { name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: ['Oil Change', 'Tire Rotation', 'Brake Service', 'Full Inspection'] },
        { name: 'mileage', label: 'Current Mileage', type: 'number', required: true, placeholder: 'e.g., 45,000' },
        { name: 'dueDate', label: 'Due Date', type: 'text', required: true, placeholder: 'e.g., Next Week' },
        { name: 'specialOffer', label: 'Special Offer', type: 'text', required: false, placeholder: 'e.g., 20% off this month' }
      ],
      example: '🔧 Time for your scheduled service! Your vehicle is due for an oil change at 45,000 miles. Book your appointment today and save 20% this month!'
    },
    {
      id: 'customer-review',
      name: 'Customer Review',
      description: 'Share positive customer experiences',
      category: 'social-proof',
      icon: '⭐',
      tags: ['review', 'testimonial', 'social-proof'],
      fields: [
        { name: 'customerName', label: 'Customer Name', type: 'text', required: true, placeholder: 'e.g., John D.' },
        { name: 'vehiclePurchased', label: 'Vehicle Purchased', type: 'text', required: true, placeholder: 'e.g., 2024 Honda CR-V' },
        { name: 'reviewText', label: 'Review Text', type: 'textarea', required: true, placeholder: 'What did the customer say?' },
        { name: 'rating', label: 'Rating', type: 'select', required: true, options: ['5 Stars', '4 Stars', '3 Stars'] }
      ],
      example: '⭐ "Amazing experience buying my 2024 Honda CR-V! The team was professional and made the process so easy. Highly recommend!" - John D.'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates', icon: '📋' },
    { id: 'inventory', name: 'Inventory', icon: '🚗' },
    { id: 'promotions', name: 'Promotions', icon: '🔥' },
    { id: 'financing', name: 'Financing', icon: '💳' },
    { id: 'engagement', name: 'Engagement', icon: '🎯' },
    { id: 'service', name: 'Service', icon: '🔧' },
    { id: 'social-proof', name: 'Social Proof', icon: '⭐' }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTemplates(mockTemplates);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a Template</h2>
        <p className="text-gray-600">Select a marketing template to start creating engaging content</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onTemplateSelect(template)}
          >
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">{template.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600">{template.category}</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4 text-sm">{template.description}</p>
            
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{template.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mb-4">
              <div className="font-medium mb-1">Required Fields:</div>
              <div className="flex flex-wrap gap-1">
                {template.fields.filter(f => f.required).slice(0, 3).map((field, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 rounded">
                    {field.label}
                  </span>
                ))}
                {template.fields.filter(f => f.required).length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    +{template.fields.filter(f => f.required).length - 3}
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <div className="font-medium mb-1">Example:</div>
              <div className="line-clamp-3">{template.example}</div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">Try adjusting your search or category filter</p>
        </div>
      )}
    </div>
  );
};
