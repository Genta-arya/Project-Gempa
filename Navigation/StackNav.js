import { createStackNavigator } from '@react-navigation/stack';
import MyTabs from './BottomTabs';
import Maps from '../Screen/Gempa/Maps';



const Stack = createStackNavigator();

export default function StackNav() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Bottom" component={MyTabs} options={{headerShown:false}} />
      <Stack.Screen name="Maps" component={Maps} options={{headerShown:true}} />
   
    </Stack.Navigator>
  );
}