import React, { useState } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { LogIn, Lock, Mail, Loader2, BookOpen, User, UserPlus } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { login, register, enterDemoMode } = useSchedule();

    // Toggle State
    const [isRegistering, setIsRegistering] = useState(false);

    // Form Fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!email || !password) {
            setError('Por favor, preencha email e senha.');
            setIsLoading(false);
            return;
        }

        if (isRegistering && !name) {
            setError('Por favor, informe seu nome completo.');
            setIsLoading(false);
            return;
        }

        try {
            if (isRegistering) {
                await register(name, email, password);
            } else {
                await login(email, password);
            }
        } catch (err: any) {
            let msg = isRegistering ? 'Falha ao criar conta.' : 'Falha ao realizar login.';
            if (err.message) {
                if (err.message.includes('API key')) msg = 'Erro de configuração da API (Chave Inválida).';
                else if (err.message.includes('Invalid login credentials')) msg = 'Email ou senha incorretos.';
                else msg = `${msg} (${err.message})`;
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
        // Optional: Clear form or keep it
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 dark:bg-slate-900 transition-colors">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:bg-slate-800 dark:border-slate-700 animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="bg-blue-600 p-8 text-center transition-colors duration-300">
                    <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 shadow-inner">
                        <BookOpen size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">CronoAulas</h1>
                    <p className="text-blue-100 text-sm">Gerenciamento escolar simplificado</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                            {isRegistering ? 'Crie sua conta' : 'Bem-vindo de volta!'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">
                            {isRegistering
                                ? 'Preencha os dados abaixo para começar.'
                                : 'Entre com suas credenciais para acessar.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Name Field - Only for Register */}
                        {isRegistering && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Nome Completo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        placeholder="Seu nome"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 dark:bg-red-900/20 dark:text-red-300 animate-in fade-in duration-200">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                                <span className="flex-1">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    {isRegistering ? 'Criando conta...' : 'Entrando...'}
                                </>
                            ) : (
                                <>
                                    {isRegistering ? 'Cadastrar' : 'Entrar'}
                                    {isRegistering ? <UserPlus size={20} /> : <LogIn size={20} />}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                            <button
                                onClick={toggleMode}
                                className="ml-1 text-blue-600 hover:text-blue-700 font-semibold hover:underline focus:outline-none dark:text-blue-400"
                            >
                                {isRegistering ? 'Fazer Login' : 'Cadastre-se'}
                            </button>
                        </p>
                    </div>

                    {/* Demo Mode Button */}
                    <div className="mt-4 text-center">
                        <button
                            onClick={enterDemoMode}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline focus:outline-none"
                        >
                            🎭 Entrar no Modo Demo
                        </button>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Explore sem cadastro
                        </p>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-gray-400 text-sm">
                © 2024 CronoAulas. Todos os direitos reservados.
            </p>
        </div>
    );
};