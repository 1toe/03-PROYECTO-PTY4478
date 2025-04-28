import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import ListsPage from './pages/lists/ListsPage';
import ListDetailsPage from './pages/lists/ListDetailsPage';
import RecommendationsPage from './pages/recommendations/RecommendationsPage';
import PrivateRoute from './components/PrivateRoute';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Ionic Dark Mode */
/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Ruta principal y redirección */}
        <Route exact path="/">
          <Redirect to="/login" />
        </Route>
        
        {/* Rutas del autjh */}
        <Route exact path="/login">
          <LoginPage />
        </Route>
        <Route exact path="/register">
          <RegisterPage />
        </Route>
        
        {/* Rutas principales de la aplicación (protegidas/privadas) */}
        <PrivateRoute exact path="/dashboard" component={DashboardPage} />
        <PrivateRoute exact path="/profile" component={ProfilePage} />
        <PrivateRoute exact path="/recommendations" component={RecommendationsPage} />
        
        {/* Rutas de listas */}
        <PrivateRoute exact path="/lists" component={ListsPage} />
        <PrivateRoute exact path="/lists/create" component={ListDetailsPage} />
        <PrivateRoute exact path="/lists/edit/:id" component={ListDetailsPage} />
        <PrivateRoute exact path="/lists/:id" component={ListDetailsPage} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
