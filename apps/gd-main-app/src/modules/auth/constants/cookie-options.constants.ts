import { AppConfigService } from '@common';
//
// export const COOKIE_OPTIONS = {
//   httpOnly: true,
//   secure: true,
//   sameSite: 'lax' as const,
//   path: '/',
// };

export const cookieOptionsProvider = {
  provide: 'COOKIE_OPTIONS',
  useFactory: (configService: AppConfigService) => {
    const isStaging = configService.get<string>('DEP_TYPE') === 'staging';

    return {
      httpOnly: true,
      secure: !isStaging,
      sameSite: isStaging ? 'none' : 'lax',
    };
  },
  inject: [AppConfigService],
};
