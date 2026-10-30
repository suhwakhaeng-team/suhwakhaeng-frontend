import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import JourneyPrototype from './JourneyPrototype';
import './journey.css';

createRoot(document.getElementById('root')!).render(<StrictMode><JourneyPrototype /></StrictMode>);
