import React, { createContext, useState, useContext } from 'react';

type TipoConta = 'PF' | 'PJ' | 'PF_PJ';

interface CadastroState {
  nome: string;
  email: string;
  senha: string;
  tipoConta: TipoConta;
}

interface CadastroContextData {
  dados: CadastroState;
  atualizarDados: (novosDados: Partial<CadastroState>) => void;
  limparDados: () => void;
}

const CadastroContext = createContext<CadastroContextData>({} as CadastroContextData);

export const CadastroProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [dados, setDados] = useState<CadastroState>({
    nome: '', email: '', senha: '', tipoConta: 'PF'
  });

  const atualizarDados = (novosDados: Partial<CadastroState>) => {
    setDados(prev => ({ ...prev, ...novosDados }));
  };

  const limparDados = () => {
    setDados({ nome: '', email: '', senha: '', tipoConta: 'PF' });
  };

  return (
    <CadastroContext.Provider value={{ dados, atualizarDados, limparDados }}>
      {children}
    </CadastroContext.Provider>
  );
};

export const useCadastro = () => useContext(CadastroContext);