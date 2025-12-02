import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui';

export const AssessmentModals = ({
  showReviewModal,
  showResultModal,
  name,
  criteria,
  responses,
  result,
  isLoading,
  onCloseReview,
  onSubmit,
  onCloseResult,
  getRiskIcon,
  getRiskColor
}) => (
  <>
    <ReviewModal
      show={showReviewModal}
      name={name}
      criteria={criteria}
      responses={responses}
      isLoading={isLoading}
      onClose={onCloseReview}
      onSubmit={onSubmit}
    />
    <ResultModal
      show={showResultModal}
      name={name}
      result={result}
      onClose={onCloseResult}
      getRiskIcon={getRiskIcon}
      getRiskColor={getRiskColor}
    />
  </>
);

const ReviewModal = ({ show, name, criteria, responses, isLoading, onClose, onSubmit }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              Review Assessment
            </h3>
            <div className="mb-6">
              <p className="text-slate-600">Customer: <span className="font-semibold text-slate-800">{name}</span></p>
            </div>
            
            <div className="space-y-4 mb-6">
              {criteria.map((criterion) => (
                <div key={criterion.id} className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-2">{criterion.category}</h4>
                  <p className="text-slate-600">
                    {criterion.options.find(opt => opt.id === responses[criterion.id])?.label || 'No response'}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="px-6 py-2"
                disabled={isLoading}
              >
                Edit Responses
              </Button>
              <Button
                onClick={onSubmit}
                className="px-6 py-2"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ResultModal = ({ show, name, result, onClose, getRiskIcon, getRiskColor }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {getRiskIcon(result?.risk)}
            </motion.div>
            
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              Assessment Complete!
            </h3>
            
            <p className="text-slate-600 mb-4">
              Assessment for <span className="font-semibold">{name}</span>
            </p>
            
            <div className={`text-2xl font-bold mb-6 ${getRiskColor(result?.risk)}`}>
              {result?.risk}
            </div>
            
            <Button
              onClick={onClose}
              className="w-full py-3"
            >
              Start New Assessment
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default AssessmentModals;