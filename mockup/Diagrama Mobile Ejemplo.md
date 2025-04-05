flowchart TD
    %% Definición de estilos mejorados
    classDef primary fill:#4682FF,color:#FFFFFF,stroke:#FFFFFF,stroke-width:2px;
    classDef secondary fill:#783296,color:#FFFFFF,stroke:#FFFFFF,stroke-width:2px;
    classDef accent1 fill:#B4FFD2,color:#783296,stroke:#FFFFFF,stroke-width:2px;
    classDef accent2 fill:#FFB496,color:#783296,stroke:#FFFFFF,stroke-width:2px;
    classDef default fill:#FFFFFF,color:#783296,stroke:#4682FF,stroke-width:2px;
    
    %% Sección de Inicio y Autenticación
    subgraph Onboarding["🚀 Inicio y Autenticación"]
        direction TB
        A["📱 Splash Screen<br>Loading View"] -->|Complete loading| B["🔑 Authentication<br>Screen"]
        
        %% Opciones de Autenticación
        B -->|Select| C["📝 Registration<br>Process"]
        B -->|Select| D["👤 Login"]
    end
    
    %% Pantalla principal (Hub)
    subgraph MainHub["🏠 Pantalla Principal"]
        direction TB
        E["🏠 Home View"]
    end
    
    %% Flujo de navegación principal
    C -->|Complete registration| E
    D -->|Valid credentials| E
    
    %% Funcionalidades principales
    subgraph Features["✨ Funcionalidades"]
        direction TB
        
        %% AI Chat
        subgraph AIFeature["🤖 Asistente IA"]
            F["💬 AI Personal<br>Interaction"]
        end
        
        %% Catálogo
        subgraph CatalogFeature["🛍️ Catálogo"]
            G["📋 Complete<br>Catalog View"]
            H["🏷️ Specific<br>Category View"]
            G -->|Select category| H
            H -->|Return| G
        end
        
        %% Mapa
        subgraph MapFeature["🗺️ Ubicaciones"]
            I["🗺️ Map View"]
            J["🏪 Store Popup"]
            I -->|Select store| J
            J -->|Close| I
        end
        
        %% Perfil
        subgraph ProfileFeature["👤 Perfil"]
            K["👤 User Profile<br>View"]
        end
    end
    
    %% Conexiones entre Home y Funcionalidades
    E -->|FAB button| F
    F -->|Close chat| E
    
    E -->|Bottom nav| G
    G -->|Return| E
    
    E -->|Bottom nav| I
    I -->|Return| E
    J -->|Filter catalog| G
    
    E -->|Bottom nav| K
    K -->|Return| E
    K -->|Log out| B
    
    %% Aplicación de estilos
    class A,D default;
    class B,G,H,I,J,K default;
    class C,F accent2;
    class E primary;
    class Onboarding secondary;
    class MainHub primary;
    class Features,AIFeature,CatalogFeature,MapFeature,ProfileFeature accent1;
