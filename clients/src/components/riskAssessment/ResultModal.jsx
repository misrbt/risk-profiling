import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui';

const ResultModal = ({ isOpen, result, onClose, onStartNew }) => {
  if (!isOpen || !result) return null;

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH RISK':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'MODERATE RISK':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'LOW RISK':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH RISK':
        return (
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'MODERATE RISK':
        return (
          <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'LOW RISK':
        return (
          <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <ResultHeader result={result} getRiskIcon={getRiskIcon} />
          <ResultContent result={result} getRiskLevelColor={getRiskLevelColor} />
          <ResultActions onClose={onClose} onStartNew={onStartNew} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ResultHeader = ({ result, getRiskIcon }) => (
  <div className="p-8 text-center border-b border-gray-200">
    <div className="flex justify-center mb-4">
      {getRiskIcon(result.risk_level)}
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">
      Assessment Complete
    </h2>
    <p className="text-gray-600">
      Customer "{result.name}" has been successfully assessed
    </p>
  </div>
);

const ResultContent = ({ result, getRiskLevelColor }) => (
  <div className="p-8 space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-500 mb-1">Customer Name</p>
        <p className="text-lg font-semibold text-gray-900">{result.name}</p>
      </div>
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-500 mb-1">Total Score</p>
        <p className="text-lg font-semibold text-gray-900">{result.total_score}</p>
      </div>
      <div className="text-center p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-500 mb-1">Risk Level</p>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskLevelColor(result.risk_level)}`}>
          {result.risk_level}
        </span>
      </div>
    </div>
    
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-2">Assessment Summary</h4>
      <p className="text-blue-800 text-sm">
        The customer has been evaluated and assigned a risk level of{' '}
        <span className="font-semibold">{result.risk_level}</span> based on their
        responses to the assessment criteria.
      </p>
    </div>
  </div>
);

const ResultActions = ({ onClose, onStartNew }) => (
  <div className="p-8 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
    <Button
      onClick={onClose}
      variant="outline"
      className="flex-1 order-2 sm:order-1"
    >
      Close
    </Button>
    <Button
      onClick={onStartNew}
      className="flex-1 order-1 sm:order-2"
      size="lg"
    >
      Start New Assessment
    </Button>
  </div>
);

export default ResultModal;