---
---
config:
    layout: elk
---
graph TD
    subgraph mobile_client [Aplicacion]
        direction LR
        app[FoodYou]
    end

    subgraph cloud_backend [Backend]
        direction LR
        api_gateway[API Gateway]

        subgraph services [Servicios Backend]
            direction LR
            auth_service[Auth Service]
            user_service[User Service]
            product_service[Product Service]
            list_service[List Service]
            rec_service[Recommendation AI Service]
            location_service[Location Service]
        end

        subgraph databases["Almacenamiento"]
            direction LR
            user_db[(User DB)]
            product_db[(Product DB)]
            list_db[(List DB)]
        end
    end

    subgraph external_services["Servicios Externos"]
        direction LR
        mapping_api[Mapping API]
        ai_platform[AI Platform]
    end

    %% Connections
    app <--> api_gateway

    api_gateway --> auth_service
    api_gateway --> user_service
    api_gateway --> product_service
    api_gateway --> list_service
    api_gateway --> rec_service
    api_gateway --> location_service

    auth_service["Servicio de Autenticación"] --> user_db
    user_service["Servicio del Usuario"] --> user_db
    product_service["Servicio de Productos"] --> product_db
    list_service --> list_db[("Listas BD")]
    list_service["Servicio de Listas"] --> user_db
    rec_service --> user_db[("Usuarios BD")]
    rec_service --> product_db[("Productos BD")]

    rec_service["Servicio de Recomendaciones con IA"] --> ai_platform["Modelo IA (Mistral)"]
    location_service["Servicio de Locación"] --> mapping_api["Mapping API (Geo.)"]

    %% Optional Styling (Uncomment if desired - ensure %% is used)
    %% classDef mobile fill:#f9f,stroke:#333,stroke-width:2px;
    %% classDef backend fill:#ccf,stroke:#333,stroke-width:2px;
    %% classDef external fill:#cfc,stroke:#333,stroke-width:2px;
    %% classDef db fill:#f8d7da,stroke:#721c24,stroke-width:1px;

    %% class app mobile;
    %% class api_gateway,auth_service,user_service,product_service,list_service,rec_service,location_service backend;
    %% class user_db,product_db,list_db db;
    %% class mapping_api,ai_platform external;

---
