import { t } from 'elysia';

export const CreateWalletSchema = {
  body: t.Object({
    network: t.Union([
      t.Literal('bitcoin'),
      t.Literal('ethereum'),
      t.Literal('polygon'),
      t.Literal('tron')
    ])
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Optional(t.Object({
        id: t.String(),
        merchantId: t.String(),
        address: t.String(),
        network: t.String(),
        balance: t.Number(),
        status: t.String(),
        createdAt: t.Date(),
        updatedAt: t.Date()
      })),
      message: t.Optional(t.String()),
      error: t.Optional(t.String())
    }),
    400: t.Object({
      success: t.Boolean(),
      error: t.String()
    }),
    401: t.Object({
      success: t.Boolean(),
      error: t.String()
    })
  }
};

export const GetWalletSchema = {
  params: t.Object({
    id: t.String()
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Optional(t.Object({
        id: t.String(),
        merchantId: t.String(),
        address: t.String(),
        network: t.String(),
        balance: t.Number(),
        status: t.String(),
        createdAt: t.Date(),
        updatedAt: t.Date()
      })),
      error: t.Optional(t.String())
    }),
    401: t.Object({
      success: t.Boolean(),
      error: t.String()
    }),
    404: t.Object({
      success: t.Boolean(),
      error: t.String()
    })
  }
};

export const ListWalletsSchema = {
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Optional(t.Array(t.Object({
        id: t.String(),
        merchantId: t.String(),
        address: t.String(),
        network: t.String(),
        balance: t.Number(),
        status: t.String(),
        createdAt: t.Date(),
        updatedAt: t.Date()
      }))),
      error: t.Optional(t.String())
    }),
    401: t.Object({
      success: t.Boolean(),
      error: t.String()
    })
  }
};