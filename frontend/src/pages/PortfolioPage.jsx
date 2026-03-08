import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Database, Mic, Code2, Rocket, Zap, 
  Mail, Linkedin, Github as GithubIcon, ChevronRight,
  Cpu, Layout, Globe, Star, Briefcase, X, Phone
} from 'lucide-react';
import { Button, Modal } from 'antd';
import ServiceCard from '../components/portfolio/ServiceCard';
import ProjectCard from '../components/portfolio/ProjectCard';

const PortfolioPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 font-sans selection:bg-cyan-500/30">
      {/* Navbar (Optional/Floating) */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center glass px-6 py-3 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center font-bold text-white">Z</div>
            <span className="font-bold text-xl tracking-tight text-white">ZEESHAN<span className="text-cyan-400">.AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#services" className="hover:text-cyan-400 transition-colors">Services</a>
            <a href="#projects" className="hover:text-cyan-400 transition-colors">Projects</a>
            <a href="#workflow" className="hover:text-cyan-400 transition-colors">Process</a>
            <Button 
              type="primary" 
              onClick={() => setIsModalOpen(true)}
              className="bg-cyan-500 border-none hover:bg-cyan-400 font-semibold h-10 px-6 rounded-xl"
            >
              Hire Me
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden bg-grid">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full opacity-20">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/30 blur-[120px] rounded-full" />
          <div className="absolute top-40 left-1/3 -translate-x-1/2 w-[400px] h-[400px] bg-purple-500/20 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
          >
            <span className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold mb-6 inline-block">
              Available for new projects
            </span>
            <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.1] text-white">
              AI Automation & <br />
              <span className="text-gradient">Chatbot Development</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 mb-12 leading-relaxed">
              I build intelligent AI chatbots, RAG systems, voice agents, and high-performance full-stack web applications that automate your business logic.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a href="#projects">
                <Button type="primary" size="large" className="bg-cyan-500 border-none hover:bg-cyan-400 font-bold h-14 px-10 rounded-2xl flex items-center justify-center w-full sm:w-auto">
                  View My Projects <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <Button 
                size="large" 
                ghost 
                onClick={() => setIsModalOpen(true)}
                className="border-gray-700 hover:border-cyan-500 hover:text-cyan-400 text-white font-bold h-14 px-10 rounded-2xl"
              >
                Contact Me
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-white mb-4">Core Services</h2>
            <div className="w-20 h-1.5 bg-cyan-500 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ServiceCard 
              icon={MessageSquare}
              title="AI Chatbots"
              description="Custom conversational agents tailored to your business knowledge, capable of handling 24/7 support."
              features={["OpenAI Powered", "Website Widget Integration", "Customer Support Automation"]}
            />
            <ServiceCard 
              icon={Database}
              title="RAG Systems"
              description="Retrieval Augmented Generation pipelines that allow LLMs to talk to your private documents accurately."
              features={["LangChain Pipelines", "Vector Database (Supabase/Pinecone)", "Semantic Knowledge Search"]}
            />
            <ServiceCard 
              icon={Mic}
              title="Voice Agents"
              description="AI-driven phone automation for call summarization, answering, and lead capturing."
              features={["Phone Answering AI", "Lead Capture Summaries", "CRM Integrations"]}
            />
            <ServiceCard 
              icon={Code2}
              title="Full Stack Apps"
              description="High-performance web applications built with the most modern and scalable technology stacks."
              features={["React / FastApi / Node.js", "Scalable Database Design", "Seamless API Integrations"]}
            />
            <ServiceCard 
              icon={Cpu}
              title="AI Integrations"
              description="Plugging AI capabilities directly into your existing dashboard or workflow without friction."
              features={["Custom API Bridges", "Automated Workflows", "Intelligent Processing"]}
            />
            <ServiceCard 
              icon={Rocket}
              title="Modern DevOps"
              description="Ensuring your high-scale applications stay online with zero downtime and fast deployments."
              features={["AWS / Docker", "CI/CD Automations", "Cloud Deployments"]}
            />
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="projects" className="py-24 px-6 bg-slate-900/40">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Featured Projects</h2>
            <p className="text-gray-400">Battle-tested AI solutions delivered to global clients.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <ProjectCard 
              title="AI Customer Support Bot"
              description="An enterprise-grade chatbot system trained on company knowledge bases using RAG. Features live human fallback and multi-platform deployment."
              image="/images/chatbot.png"
              tags={["OpenAI", "Supabase", "React", "RAG"]}
              link="#"
            />
            <ProjectCard 
              title="Semantic Knowledge Assistant"
              description="A document analysis platform that uses semantic search to find answers within thousands of PDFs and Excel files instantly."
              image="/images/rag.png"
              tags={["LangChain", "FastAPI", "Pinecone", "Python"]}
              link="#"
            />
            <ProjectCard 
              title="Voice Automation Agent"
              description="Holographic voice orb that handles inbound customer calls, summarizes the intent, and logs lead details directly into the CRM."
              image="/images/voice.png"
              tags={["Vapi", "Python", "Webhooks", "Node.js"]}
              link="#"
            />
            <ProjectCard 
              title="AI Lead Capture System"
              description="Dynamic conversational forms that convert higher than static landing pages by engaging users in real-time dialog."
              image="/images/leadgen.png"
              tags={["Gemini", "Vite", "Edge Functions"]}
              link="#"
            />
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-16">The Delivery Process</h2>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0 -translate-y-1/2 z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
              {[
                { step: "01", title: "Consultation", desc: "Understanding the core business problem and AI feasibility." },
                { step: "02", title: "Architecture", desc: "Designing the LLM pipeline, RAG structure, and API schema." },
                { step: "03", title: "Development", desc: "Building the engine, fine-tuning responses, and crafting the UI." },
                { step: "04", title: "Deployment", desc: "Going live on optimized cloud infrastructure like AWS or PythonAnywhere." },
                { step: "05", title: "Optimization", desc: "Continuous monitoring and response refinement based on analytics." }
              ].map((item, idx) => (
                <div key={idx} className="glass p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold mb-6 shadow-lg shadow-cyan-500/20">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-bold mb-3 text-white">{item.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-6 border-y border-white/5 bg-slate-900/20">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
           {/* Replace these with actual logos or iconic badges */}
           <div className="flex flex-col items-center gap-2">
             <Zap className="w-10 h-10 text-cyan-400" />
             <span className="text-xs font-bold tracking-widest text-white">OPENAI</span>
           </div>
           <div className="flex flex-col items-center gap-2">
             <Database className="w-10 h-10 text-cyan-400" />
             <span className="text-xs font-bold tracking-widest text-white">SUPABASE</span>
           </div>
           <div className="flex flex-col items-center gap-2">
             <Layout className="w-10 h-10 text-cyan-400" />
             <span className="text-xs font-bold tracking-widest text-white">REACT</span>
           </div>
           <div className="flex flex-col items-center gap-2">
             <Globe className="w-10 h-10 text-cyan-400" />
             <span className="text-xs font-bold tracking-widest text-white">FASTAPI</span>
           </div>
           <div className="flex flex-col items-center gap-2">
             <Star className="w-10 h-10 text-cyan-400" />
             <span className="text-xs font-bold tracking-widest text-white">LANGCHAIN</span>
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto glass p-12 md:p-20 rounded-[40px] text-center border-white/10 relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8">
            Let's build your <br />
            <span className="text-cyan-400">AI Assistant</span>
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Ready to automate your customer support or build a custom RAG agent? 
            Let's talk about your next project.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Button 
              size="large" 
              onClick={() => setIsModalOpen(true)}
              className="bg-cyan-500 border-none hover:bg-cyan-400 text-white font-bold h-16 px-12 rounded-2xl flex items-center text-lg shadow-lg shadow-cyan-500/20"
            >
              Get In Touch
            </Button>
          </div>
          
          <div className="mt-12 flex justify-center gap-8">
            <a href="https://www.linkedin.com/in/zeeshan-dilawar-352930162/" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
              <Linkedin className="w-6 h-6 text-gray-400 group-hover:text-cyan-400" />
            </a>
            <a href="https://www.upwork.com/freelancers/~01afb668d3e7eba10e" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
              <Briefcase className="w-6 h-6 text-gray-400 group-hover:text-green-400" />
            </a>
          </div>
        </div>
        
        {/* Background glow for CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 blur-[150px] -z-10 rounded-full" />
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Zeeshan. AI & Full-Stack Developer. Built with E-LABZ.
        </p>
      </footer>

      {/* Hire Me Modal */}
      <Modal
        title={null}
        footer={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        centered
        width={600}
        closeIcon={null}
        styles={{ 
          content: { 
            backgroundColor: '#0f172a', 
            borderRadius: '24px', 
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 0,
            overflow: 'hidden'
          } 
        }}
      >
        <div className="p-8 md:p-12 relative">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center mb-10">
            <h3 className="text-3xl font-black text-cyan-400 mb-2 leading-tight">Let's build your AI Future</h3>
            <p className="text-gray-400">Choose your preferred way to connect and let's discuss your project.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <a 
              href="https://www.upwork.com/freelancers/~01afb668d3e7eba10e" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform">
                <Briefcase className="text-green-400 w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-lg">Hire via Upwork</div>
                <div className="text-gray-500 text-sm">Secure and professional contracts</div>
              </div>
              <ChevronRight className="ml-auto w-5 h-5 text-gray-600 group-hover:text-cyan-400" />
            </a>

            <a 
              href="https://wa.me/923481629862" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform">
                <MessageSquare className="text-cyan-400 w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-lg">Chat on WhatsApp</div>
                <div className="text-gray-500 text-sm">Instant responses & quick queries</div>
              </div>
              <ChevronRight className="ml-auto w-5 h-5 text-gray-600 group-hover:text-cyan-400" />
            </a>

            <a 
              href="https://www.linkedin.com/in/zeeshan-dilawar-352930162/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform">
                <Linkedin className="text-blue-400 w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-lg">LinkedIn Profile</div>
                <div className="text-gray-500 text-sm">Professional network & portfolio</div>
              </div>
              <ChevronRight className="ml-auto w-5 h-5 text-gray-600 group-hover:text-cyan-400" />
            </a>

            <a 
              href="mailto:zdilawar68@gmail.com" 
              className="flex items-center p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform">
                <Mail className="text-purple-400 w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-lg">Send an Email</div>
                <div className="text-gray-500 text-sm">Detailed project discussions</div>
              </div>
              <ChevronRight className="ml-auto w-5 h-5 text-gray-600 group-hover:text-cyan-400" />
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PortfolioPage;
