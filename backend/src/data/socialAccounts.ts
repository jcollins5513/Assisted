export interface SocialMediaAccount {
  id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  name: string;
  username: string;
  avatar: string;
  connected: boolean;
  followers: number;
}

export const socialAccounts: SocialMediaAccount[] = [
  {
    id: 'fb-1',
    platform: 'facebook',
    name: 'Car Sales AI',
    username: 'carsalesai',
    avatar: 'https://unavatar.io/facebook/carsalesai',
    connected: true,
    followers: 1250
  },
  {
    id: 'ig-1',
    platform: 'instagram',
    name: 'Car Sales AI',
    username: 'carsalesai',
    avatar: 'https://unavatar.io/instagram/carsalesai',
    connected: false,
    followers: 0
  },
  {
    id: 'tw-1',
    platform: 'twitter',
    name: 'Car Sales AI',
    username: 'carsalesai',
    avatar: 'https://unavatar.io/twitter/carsalesai',
    connected: false,
    followers: 0
  }
];
