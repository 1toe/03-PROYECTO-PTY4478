import React from 'react';
import { Route } from 'react-router-dom';
import SimpleChat from './SimpleChat';

const SimpleChatRoutes: React.FC = () => {
  return (
    <>
      <Route exact path="/simplechat" component={SimpleChat} />
    </>
  );
};

export default SimpleChatRoutes;
