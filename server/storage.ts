import { getStorage } from "./lib/storage-singleton.js";
import type {
  IAccessoryRepository,
  ICategoryRepository,
  ICertificateRepository,
  IContactRepository,
  IContentRepository,
  IFabricRepository,
  IFiberRepository,
  IInquiryRepository,
  IManufacturingRepository,
  IMediaRepository,
  INavigationRepository,
  IProductRepository,
  ISizeChartRepository,
  ISustainabilityRepository,
  ISystemRepository,
  ITechnologyRepository,
  IUserRepository,
  IWebhookRepository,
} from "./repositories/storage-interfaces.js";

export interface IStorage
  extends IUserRepository,
    ICategoryRepository,
    IFiberRepository,
    IFabricRepository,
    ICertificateRepository,
    ISizeChartRepository,
    IAccessoryRepository,
    IMediaRepository,
    IProductRepository,
    INavigationRepository,
    IContactRepository,
    IInquiryRepository,
    IContentRepository,
    ISustainabilityRepository,
    IManufacturingRepository,
    ITechnologyRepository,
    IWebhookRepository,
    ISystemRepository {}

export const storage = getStorage();
