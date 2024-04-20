import { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc'; // Assuming swaggerSpec is of type SwaggerObject

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Easy Task API',
      description: "API endpoints for a easy task service documented on swagger",
      contact: {
        email: "easy.task.se2@gmail.com",
      },
      version: '1.0.0',
    },
    servers: [
      {
        url: "<your live url here>",
        description: "Live server"
      },
    ]
  },
  // looks for configuration in specified directories
  apis: ['./router/*.js'],
}
const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app: Application, port: number) {
  // Swagger Page
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Documentation in JSON format
  app.get('/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

export default swaggerDocs;
