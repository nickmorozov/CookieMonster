/** Section: Functions related to caching income */

import BuildingGetPrice from '../../Sim/SimulationEvents/BuyBuilding.js';
import BuyBuildingsBonusIncome from '../../Sim/SimulationEvents/BuyBuildingBonusIncome.js';
import BuyUpgradesBonusIncome from '../../Sim/SimulationEvents/BuyUpgrades.js';
import FillCMDCache from '../FillCMDCache.js';
import {
  CacheAverageGainBank,
  CacheAverageGainWrink,
  CacheAverageGainWrinkFattest,
  CacheDoRemakeBuildPrices, // eslint-disable-line no-unused-vars
  CacheObjects1,
  CacheObjects10,
  CacheObjects50,
  CacheObjects100,
  CacheObjectsMax,
  CacheObjectsNextAchievement,
  CacheUpgrades,
} from '../VariablesAndData.js';

/**
 * This functions starts the calculation/simulation of the bonus income of buildings
 * It is called by CM.Cache.CacheIncome()
 * @param	{amount}	amount	Amount to be bought
 * @parem	{string}	target	The target Cache object ("Objects1", "Objects10" or "Objects100")
 */
function CacheBuildingIncome(amount) {
  const result = {};
  Object.keys(Game.Objects).forEach((i) => {
    result[i] = {};
    result[i].bonus = BuyBuildingsBonusIncome(i, amount);
    if (amount !== 1) {
      CacheDoRemakeBuildPrices = 1;
    }
  });
  return result;
}

/**
 * This function calculates the bonus income for Max mode
 * Each building uses its own bulkBuyable amount (or defaults to 1000)
 * It is called by CM.Cache.CacheIncome()
 */
function CacheBuildingIncomeMax() {
  const result = {};
  Object.keys(Game.Objects).forEach((i) => {
    result[i] = {};
    // Use bulkBuyable from MaxButtonRestorer mod if available, otherwise default to 1000
    const amount = Game.Objects[i].bulkBuyable || 1000;
    result[i].bonus = BuyBuildingsBonusIncome(i, amount);
    result[i].AmountNeeded = amount;
    CacheDoRemakeBuildPrices = 1;
  });
  return result;
}

/**
 * This functions starts the calculation/simulation of the bonus income of upgrades
 * It is called by CM.Cache.CacheIncome()
 */
function CacheUpgradeIncome() {
  CacheUpgrades = {};
  for (let i = 0; i < Game.UpgradesInStore.length; i++) {
    const upgradeName = Game.UpgradesInStore[i].name;
    const bonusIncome = BuyUpgradesBonusIncome(upgradeName);
    if (upgradeName === 'Elder Pledge') {
      CacheUpgrades[upgradeName] = {
        bonus: Game.cookiesPs - CacheAverageGainBank,
      };
      if (Game.mods.cookieMonsterFramework.saveData.cookieMonsterMod.settings.CalcWrink === 1)
        CacheUpgrades[upgradeName].bonus -= CacheAverageGainWrink;
      else if (Game.mods.cookieMonsterFramework.saveData.cookieMonsterMod.settings.CalcWrink === 2)
        CacheUpgrades[upgradeName].bonus -= CacheAverageGainWrinkFattest;
      if (!Number.isFinite(CacheUpgrades[upgradeName].bonus)) CacheUpgrades[upgradeName].bonus = 0;
    } else {
      CacheUpgrades[upgradeName] = {};
      if (bonusIncome[0]) CacheUpgrades[upgradeName].bonus = bonusIncome[0];
      if (bonusIncome[1]) CacheUpgrades[upgradeName].bonusMouse = bonusIncome[1];
    }
  }
}

/**
 * This functions caches the price of each building and stores it in the cache
 */
export function CacheBuildingsPrices() {
  Object.keys(Game.Objects).forEach((i) => {
    CacheObjects1[i].price = BuildingGetPrice(
      i,
      Game.Objects[i].basePrice,
      Game.Objects[i].amount,
      Game.Objects[i].free,
      1,
    );
    CacheObjects10[i].price = BuildingGetPrice(
      i,
      Game.Objects[i].basePrice,
      Game.Objects[i].amount,
      Game.Objects[i].free,
      10,
    );
    CacheObjects50[i].price = BuildingGetPrice(
      i,
      Game.Objects[i].basePrice,
      Game.Objects[i].amount,
      Game.Objects[i].free,
      50,
    );
    CacheObjects100[i].price = BuildingGetPrice(
      i,
      Game.Objects[i].basePrice,
      Game.Objects[i].amount,
      Game.Objects[i].free,
      100,
    );
    // For Max mode, use the stored AmountNeeded (bulkBuyable or 1000)
    CacheObjectsMax[i].price = BuildingGetPrice(
      i,
      Game.Objects[i].basePrice,
      Game.Objects[i].amount,
      Game.Objects[i].free,
      CacheObjectsMax[i].AmountNeeded || 1000,
    );
    CacheObjectsNextAchievement[i].price = BuildingGetPrice(
      i,
      Game.Objects[i].basePrice,
      Game.Objects[i].amount,
      Game.Objects[i].free,
      CacheObjectsNextAchievement[i].AmountNeeded,
    );
  });

  FillCMDCache({ CacheObjectsNextAchievement });
}

/**
 * This functions caches the income gain of each building and upgrade and stores it in the cache
 * It is called by CM.Main.Loop() and CM.Cache.InitCache()
 */
export function CacheIncome() {
  // Simulate Building Buys for 1, 10, 50, 100 and Max amount
  CacheObjects1 = CacheBuildingIncome(1);
  CacheObjects10 = CacheBuildingIncome(10);
  CacheObjects50 = CacheBuildingIncome(50);
  CacheObjects100 = CacheBuildingIncome(100);
  CacheObjectsMax = CacheBuildingIncomeMax();

  // Simulate Upgrade Buys
  CacheUpgradeIncome();
}
