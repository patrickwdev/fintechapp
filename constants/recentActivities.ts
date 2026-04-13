import { Colors } from './Colors';

export type RecentActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  amountColor: string;
  iconName: 'ShoppingBag' | 'Briefcase' | 'Film' | 'Utensils';
  iconBg: string;
};

export const RECENT_ACTIVITIES: RecentActivityItem[] = [
  {
    id: '1',
    title: 'Starbucks Coffee',
    subtitle: 'Today, 09:24 AM',
    amount: '-$5.50',
    amountColor: Colors.text,
    iconName: 'ShoppingBag',
    iconBg: Colors.primary,
  },
  {
    id: '2',
    title: 'Salary Deposit',
    subtitle: 'Yesterday, 04:15 PM',
    amount: '+$2,400.00',
    amountColor: Colors.success,
    iconName: 'Briefcase',
    iconBg: '#22C55E',
  },
  {
    id: '3',
    title: 'Netflix Subscription',
    subtitle: 'Oct 24, 2023',
    amount: '-$15.99',
    amountColor: Colors.text,
    iconName: 'Film',
    iconBg: '#F97316',
  },
  {
    id: '4',
    title: 'Uber Eats',
    subtitle: 'Oct 22, 2023',
    amount: '-$42.80',
    amountColor: Colors.text,
    iconName: 'Utensils',
    iconBg: '#0EA5E9',
  },
];

export function getActivityById(id: string): RecentActivityItem | undefined {
  return RECENT_ACTIVITIES.find((a) => a.id === id);
}
