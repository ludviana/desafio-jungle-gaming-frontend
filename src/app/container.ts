import { createMarketplaceUseCases } from '../application/use-cases/create-marketplace-use-cases';
import { axiosMarketplaceRepository } from '../infrastructure/http/axios-marketplace-repository';

export const marketplace = createMarketplaceUseCases(axiosMarketplaceRepository);
