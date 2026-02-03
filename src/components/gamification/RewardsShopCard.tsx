import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Star, Palette, Crown, Check, ShoppingBag } from 'lucide-react';
import { useAvailableRewards, useMyRewards, usePurchaseReward, useEquipReward, useUnequipReward, type Reward } from '@/hooks/useRewards';
import { useGamification } from '@/hooks/useGamification';
import { cn } from '@/lib/utils';

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-muted text-muted-foreground border-border',
  rare: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  legendary: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
};

const TYPE_ICONS: Record<string, typeof Palette> = {
  theme: Palette,
  title: Crown,
  avatar: Star,
  badge_style: Gift,
  feature: Star,
};

const TYPE_LABELS: Record<string, string> = {
  theme: 'Thèmes',
  title: 'Titres',
  avatar: 'Avatars',
  badge_style: 'Styles',
  feature: 'Fonctionnalités',
};

export function RewardsShopCard() {
  const [activeTab, setActiveTab] = useState('shop');
  const { data: availableRewards = [], isLoading: loadingShop } = useAvailableRewards();
  const { data: myRewards = [], isLoading: loadingMy } = useMyRewards();
  const purchaseReward = usePurchaseReward();
  const equipReward = useEquipReward();
  const unequipReward = useUnequipReward();
  const { profile } = useGamification();

  const ownedIds = new Set(myRewards.map(r => r.reward_id));
  const currentXp = profile?.total_xp || 0;

  // Group rewards by type
  const rewardsByType = availableRewards.reduce((acc, reward) => {
    const type = reward.reward_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(reward);
    return acc;
  }, {} as Record<string, Reward[]>);

  const renderRewardCard = (reward: Reward, owned: boolean, userReward?: typeof myRewards[0]) => {
    const canAfford = currentXp >= reward.xp_cost;
    const isEquipped = userReward?.is_equipped;
    const TypeIcon = TYPE_ICONS[reward.reward_type] || Gift;

    return (
      <div
        key={reward.id}
        className={cn(
          'p-4 rounded-lg border transition-all',
          owned 
            ? 'bg-success/5 border-success/30' 
            : canAfford 
              ? 'bg-card/50 border-border/50 hover:border-primary/50' 
              : 'bg-card/30 border-border/30 opacity-60'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="text-3xl">{reward.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm truncate">{reward.name}</p>
              <Badge 
                variant="outline" 
                className={cn('text-xs capitalize', RARITY_COLORS[reward.rarity])}
              >
                {reward.rarity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {reward.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-3.5 w-3.5 text-primary" />
            <span className={cn(
              'font-bold',
              !canAfford && !owned && 'text-destructive'
            )}>
              {reward.xp_cost.toLocaleString()} XP
            </span>
          </div>

          {owned ? (
            <Button
              size="sm"
              variant={isEquipped ? 'default' : 'outline'}
              onClick={() => {
                if (isEquipped) {
                  unequipReward.mutate(userReward!.id);
                } else {
                  equipReward.mutate({ 
                    userRewardId: userReward!.id, 
                    rewardType: reward.reward_type 
                  });
                }
              }}
              disabled={equipReward.isPending || unequipReward.isPending}
              className="gap-1"
            >
              {isEquipped ? (
                <>
                  <Check className="h-3 w-3" />
                  Équipé
                </>
              ) : (
                'Équiper'
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => purchaseReward.mutate(reward.id)}
              disabled={!canAfford || purchaseReward.isPending}
              className="gap-1"
            >
              <ShoppingBag className="h-3 w-3" />
              Acheter
            </Button>
          )}
        </div>
      </div>
    );
  };

  const isLoading = loadingShop || loadingMy;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Boutique
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <Star className="h-3 w-3 text-primary" />
            {currentXp.toLocaleString()} XP
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shop" className="gap-1">
              <ShoppingBag className="h-3.5 w-3.5" />
              Boutique
            </TabsTrigger>
            <TabsTrigger value="owned" className="gap-1">
              <Gift className="h-3.5 w-3.5" />
              Mes récompenses ({myRewards.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="mt-4 space-y-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">Chargement...</p>
            ) : Object.keys(rewardsByType).length === 0 ? (
              <div className="text-center py-6">
                <Gift className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Aucune récompense disponible</p>
              </div>
            ) : (
              Object.entries(rewardsByType).map(([type, rewards]) => (
                <div key={type}>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    {TYPE_LABELS[type] || type}
                    <Badge variant="secondary" className="text-xs">
                      {rewards.length}
                    </Badge>
                  </h4>
                  <div className="grid gap-3">
                    {rewards.map((reward) => {
                      const owned = ownedIds.has(reward.id);
                      const userReward = myRewards.find(r => r.reward_id === reward.id);
                      return renderRewardCard(reward, owned, userReward);
                    })}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="owned" className="mt-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">Chargement...</p>
            ) : myRewards.length === 0 ? (
              <div className="text-center py-6">
                <Gift className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="font-medium">Aucune récompense</p>
                <p className="text-sm text-muted-foreground">
                  Achète des récompenses avec tes XP !
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {myRewards.map((userReward) => 
                  userReward.reward && renderRewardCard(userReward.reward, true, userReward)
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
