import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { propertyService } from '../services/property.service';

export const propertyController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const result = await propertyService.search(req.query as never);
    res.json({ data: result, error: null });
  }),

  detail: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertyService.getDetail(Number(req.params.id));
    res.json({ data: property, error: null });
  }),

  compare: asyncHandler(async (req: Request, res: Response) => {
    const ids = String(req.query.ids)
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((n) => !Number.isNaN(n));
    const items = await propertyService.compare(ids);
    res.json({ data: { items }, error: null });
  }),

  similar: asyncHandler(async (req: Request, res: Response) => {
    const items = await propertyService.similar(Number(req.params.id));
    res.json({ data: { items }, error: null });
  }),

  nearby: asyncHandler(async (req: Request, res: Response) => {
    const result = await propertyService.nearbyAmenities(Number(req.params.id));
    res.json({ data: result, error: null });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertyService.create(req.user!.profile, req.body);
    res.status(201).json({ data: property, error: null });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertyService.update(Number(req.params.id), req.user!.profile, req.body);
    res.json({ data: property, error: null });
  }),

  submit: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertyService.submitForReview(Number(req.params.id), req.user!.profile);
    res.json({ data: property, error: null });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertyService.remove(Number(req.params.id), req.user!.profile);
    res.json({ data: property, error: null });
  }),

  mine: asyncHandler(async (req: Request, res: Response) => {
    const items = await propertyService.myListings(req.user!.profile);
    res.json({ data: { items }, error: null });
  }),

  addImage: asyncHandler(async (req: Request, res: Response) => {
    const { image_url, is_cover = false, sort_order = 0 } = req.body;
    const image = await propertyService.addImage(Number(req.params.id), req.user!.profile, image_url, is_cover, sort_order);
    res.status(201).json({ data: image, error: null });
  }),

  removeImage: asyncHandler(async (req: Request, res: Response) => {
    await propertyService.removeImage(Number(req.params.id), Number(req.params.imageId), req.user!.profile);
    res.json({ data: { success: true }, error: null });
  }),
};
