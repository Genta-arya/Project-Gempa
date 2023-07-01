import { createStackNavigator } from '@react-navigation/stack';
import MyTabs from './BottomTabs';



const Stack = createStackNavigator();

export default function StackNav() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Bottom" component={MyTabs} options={{headerShown:false}} />
   
    </Stack.Navigator>
  );
}