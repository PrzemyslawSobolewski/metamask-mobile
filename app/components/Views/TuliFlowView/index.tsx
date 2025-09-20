import React from 'react';
import GenerateCodeView from './GenereteCodeView';
import TransactionFinalization from './TransactionFinalization';

interface TuliFlowViewProps {
  view: 'GENERETE_CODE' | 'FINALIZATION';
}

const TuliFlowView = ({ view }: TuliFlowViewProps) => (
  <>
    {view === 'GENERETE_CODE' && <GenerateCodeView />}
    {view === 'FINALIZATION' && <TransactionFinalization />}
  </>
);

export default TuliFlowView;
