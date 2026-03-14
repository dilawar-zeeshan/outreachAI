import React from 'react';
import { motion } from 'framer-motion';

const ServiceCard = ({ icon: Icon, title, description, features }) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="p-8 rounded-2xl glass border border-white/5 hover:border-cyan-500/30 transition-all duration-300 group"
    >
      <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
        <Icon className="w-8 h-8 text-cyan-400" />
      </div>
      <h3 className="text-2xl font-bold mb-4 text-white">{title}</h3>
      <p className="text-gray-400 mb-6 leading-relaxed">{description}</p>
      <ul className="space-y-3">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center text-sm text-gray-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mr-3"></span>
            {feature}
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default ServiceCard;
