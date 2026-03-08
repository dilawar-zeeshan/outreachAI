import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';
import { Tag } from 'antd';

const ProjectCard = ({ title, description, image, tags, link, github }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl overflow-hidden glass border border-white/5 hover:border-purple-500/30 transition-all duration-300"
    >
      <div className="relative h-64 overflow-hidden group">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>
      
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, idx) => (
            <Tag key={idx} color="purple" className="border-none bg-purple-500/10 text-purple-400 m-0">
              {tag}
            </Tag>
          ))}
        </div>
        <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
        <p className="text-gray-400 mb-6 text-sm leading-relaxed">{description}</p>
        
        <div className="flex gap-4">
          {github && (
            <a href={github} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors">
              <Github className="w-4 h-4 mr-2" /> Code
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
