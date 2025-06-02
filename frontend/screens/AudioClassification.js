import React from 'react';
import { AppProvider } from './emotion/context/AppContext';
import RealtimeCameraView from './emotion/components/RealtimeCameraView';

export default function Emotion() {
  return (
    <AppProvider>
      <RealtimeCameraView />
    </AppProvider>
  );
}